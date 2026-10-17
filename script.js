
/* ==========================================
   OPENAI İLE GÜVENLİ SENARYO ÜRETİMİ
========================================== */

async function generateScript() {
  const topic = document.getElementById("topic").value.trim();
  const language = document.getElementById("language").value;
  const resultBox = document.getElementById("result");
  const button = document.querySelector('button[onclick="generateScript()"]');

  if (!topic) {
    alert("Lütfen video konusunu yaz.");
    return;
  }
  resultBox.style.display = "block";
  resultBox.innerText = "Senaryo hazırlanıyor...";
  if (button) button.disabled = true;
  try {
    const response = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, language })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Sunucu hatası: ${response.status}`);
    const answer = (data.script || "").trim();
    if (!answer) throw new Error("Senaryo cevabı boş geldi.");
    resultBox.innerText = answer;
  } catch (error) {
    resultBox.innerText = "Hata: " + error.message;
  } finally {
    if (button) button.disabled = false;
  }
}


/* ==========================================
   GERÇEK YAPAY ZEKÂ VİDEOSU (SORA 2)
========================================== */

async function createVideoPlan() {
  const topic = document.getElementById("topic").value.trim();
  const scriptText = document.getElementById("result").innerText.trim();
  const status = document.getElementById("videoStatus");
  const button = document.querySelector(".video-button");

  if (!topic) return alert("Önce video konusunu yaz.");
  if (!scriptText || scriptText.startsWith("Hata:")) {
    return alert("Önce senaryo üretin. Video, bu senaryoya göre hazırlanır.");
  }

  status.style.display = "block";
  status.innerText = "OpenAI gerçek video üretimini başlatıyor...";
  if (button) button.disabled = true;

  try {
    const response = await fetch("/api/video-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        script: scriptText,
        style: document.getElementById("style").value,
        platform: document.getElementById("platform").value,
        seconds: document.getElementById("duration").value
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Video başlatılamadı.");

    const videoId = data.id;
    let delay = 10000;
    while (true) {
      status.innerText = "Gerçek video hazırlanıyor. Bu işlem birkaç dakika sürebilir...";
      await new Promise(resolve => setTimeout(resolve, delay));
      const check = await fetch(`/api/video-status?id=${encodeURIComponent(videoId)}`);
      const state = await check.json().catch(() => ({}));
      if (!check.ok) throw new Error(state.error || "Video durumu alınamadı.");
      if (state.status === "completed") break;
      if (state.status === "failed" || state.status === "expired") {
        throw new Error(state.error || "OpenAI video üretimini tamamlayamadı.");
      }
      status.innerText = `Gerçek video hazırlanıyor: %${state.progress || 0}. Lütfen bekleyin.`;
      delay = Math.min(Math.round(delay * 1.25), 20000);
    }

    status.innerText = "Video tamamlandı. MP4 indiriliyor...";
    const download = await fetch(`/api/video-status?id=${encodeURIComponent(videoId)}&download=1`);
    if (!download.ok) throw new Error("Video hazır ancak MP4 indirilemedi.");
    const blob = await download.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "openai-yapay-zeka-videosu.mp4";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.innerText = "Gerçek yapay zekâ videosu hazır. MP4 dosyası indirildi.";
  } catch (error) {
    status.innerText = "Hata: " + error.message;
  } finally {
    if (button) button.disabled = false;
  }
}
