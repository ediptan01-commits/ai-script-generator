/* ===================================== SENARYO OLUŞTURMA ===================================== */

async function generateScript() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const topic = document.getElementById("topic").value.trim();
  const language = document.getElementById("language").value;
  const resultBox = document.getElementById("result");

  if (!apiKey || !topic) {
    alert("Gemini API anahtarını ve konuyu gir.");
    return;
  }

  localStorage.setItem("gemini_api_key", apiKey);
  resultBox.style.display = "block";
  resultBox.innerText = "Senaryo hazırlanıyor...";

  const prompt = ` Sen profesyonel bir kısa video senaristisin. KONU: ${topic} DİL: ${language} Yaklaşık 30 saniyelik bir video senaryosu hazırla. 🔥 VİRAL KANCALAR Üç dikkat çekici giriş yaz. 🎬 VİDEO SENARYOSU Akıcı, ilgi çekici senaryo yaz. 📱 EKRAN YAZILARI Kısa ekran yazıları ekle. 🎯 ÇAĞRI İzleyiciyi harekete geçiren bir kapanış yaz. Gereksiz açıklama yapma. `;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Gemini API hatası.");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Senaryo cevabı alınamadı.");
    }

    resultBox.innerText = text;
  } catch (error) {
    resultBox.innerText = "Hata: " + error.message;
  }
}

/* ===================================== KAYITLI API ANAHTARINI YÜKLE ===================================== */

window.addEventListener("DOMContentLoaded", () => {
  const savedKey = localStorage.getItem("gemini_api_key");
  const input = document.getElementById("apiKey");

  if (savedKey && input) {
    input.value = savedKey;
  }
});

/* ===================================== GERÇEK VİDEO ÜRETİMİ VE MP4 İNDİRME ===================================== */

async function createVideoPlan() {
  const topic = document.getElementById("topic").value.trim();
  const language = document.getElementById("language").value;
  const duration = document.getElementById("duration").value;
  const platform = document.getElementById("platform").value;
  const style = document.getElementById("style").value;
  const status = document.getElementById("videoStatus");

  if (!topic) {
    alert("Önce video konusunu yaz.");
    return;
  }

  status.style.display = "block";
  status.innerText = "🎬 Video üretimi başlatılıyor...";

  try {
    // API anahtarı tarayıcıdan gönderilmez.
    // Sunucu Vercel'deki GEMINI_API_KEY değişkenini kullanır.
    const startResponse = await fetch("/api/generate-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic,
        style: `${style}. Language: ${language}. Platform: ${platform}`,
        duration: 8,
      }),
    });

    const startData = await startResponse.json();

    if (!startResponse.ok || !startData.operation) {
      throw new Error(startData.error || "Video üretimi başlatılamadı.");
    }

    const operation = startData.operation;

    status.innerText =
      "⏳ Video hazırlanıyor. Bu işlem birkaç dakika sürebilir.";

    // Videonun hazır olup olmadığını düzenli kontrol et.
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 10000));

      status.innerText = `⏳ Video hazırlanıyor... (${attempt + 1}. kontrol)`;

      const checkResponse = await fetch("/api/video-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ operation }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error(checkData.error || "Video durumu kontrol edilemedi.");
      }

      if (checkData.error) {
        throw new Error(checkData.error);
      }

      if (checkData.done) {
        status.innerText = "📥 Video hazır. MP4 indiriliyor...";

        const downloadResponse = await fetch("/api/download-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ operation }),
        });

        if (!downloadResponse.ok) {
          let message = "Video indirilemedi.";

          try {
            const errorData = await downloadResponse.json();
            message = errorData.error || message;
          } catch (_) {}

          throw new Error(message);
        }

        const videoBlob = await downloadResponse.blob();

        if (!videoBlob.size) {
          throw new Error("İndirilen video dosyası boş.");
        }

        const videoUrl = URL.createObjectURL(videoBlob);
        const link = document.createElement("a");

        link.href = videoUrl;
        link.download = "yapay-zeka-videosu.mp4";
        document.body.appendChild(link);

async function createVideoPlan() {
  const topic = document.getElementById("topic").value.trim();
  const duration = Number(document.getElementById("duration").value || 30);
  const style = document.getElementById("style").value;
  const status = document.getElementById("videoStatus");
  const scriptBox = document.getElementById("result");

  if (!topic) {
    alert("Önce video konusunu yaz.");
    return;
  }

  status.style.display = "block";
  status.innerText = "Slayt videosu hazırlanıyor...";

  const button = document.querySelector(".video-button");
  if (button) button.disabled = true;

  try {
    const text = scriptBox.innerText;
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith("Hata:"));

    const slides = [
      topic,
      ...sentences.slice(0, 6)
    ].slice(0, 7);

    while (slides.length < 4) {
      slides.push(
        slides.length === 2
          ? "İşte bilmen gereken önemli ayrıntılar"
          : "Sen bu konuda ne düşünüyorsun?"
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;

    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(25);

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 2500000
    });

    const chunks = [];
    recorder.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data);
    };

    const secondsPerSlide = duration / slides.length;
    let startTime = null;
    let frameId;

    function draw(now) {
      if (startTime === null) startTime = now;

      const elapsed = (now - startTime) / 1000;

      if (elapsed >= duration) {
        recorder.stop();
        return;
      }

      const index = Math.min(
        slides.length - 1,
        Math.floor(elapsed / secondsPerSlide)
      );

      const localTime = elapsed % secondsPerSlide;
      const colors = [
        ["#0f172a", "#075985"],
        ["#1e1b4b", "#7e22ce"],
        ["#052e16", "#15803d"],
        ["#431407", "#c2410c"],
        ["#172554", "#4338ca"]
      ][index % 5];

      const bg = ctx.createLinearGradient(0, 0, 720, 1280);
      bg.addColorStop(0, colors[0]);
      bg.addColorStop(1, colors[1]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 720, 1280);

      // Hareketli dekoratif daireler
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        570 + Math.sin(elapsed) * 35,
        250 + Math.cos(elapsed * 0.7) * 30,
        170,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.globalAlpha = 1;

      // Başlık
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "bold 25px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        "KISA VİDEO  •  " + (index + 1) + "/" + slides.length,
        55,
        490
      );

      // Metni satırlara böl
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial";

      const words = slides[index].split(/\s+/);
      const lines = [];
      let line = "";

      for (const word of words) {
        const test = line ? line + " " + word : word;

        if (ctx.measureText(test).width > 600 && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }

      if (line) lines.push(line);

      let y = 590 + Math.sin(localTime * 1.5) * 5;

      lines.slice(0, 6).forEach(row => {
        ctx.fillText(row, 55, y);
        y += 65;
      });

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "24px Arial";
      ctx.fillText(style + " • 9:16", 55, 1160);

      ctx.fillStyle = "#ffffff44";
      ctx.fillRect(55, 1190, 610, 7);

      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(
        55,
        1190,
        610 * ((index + localTime / secondsPerSlide) / slides.length),
        7
      );

      status.innerText =
        "Slayt videosu hazırlanıyor: %" +
        Math.min(99, Math.floor(elapsed / duration * 100));

      frameId = requestAnimationFrame(draw);
    }

    const finished = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve(
        new Blob(chunks, { type: mime })
      );
      recorder.onerror = () => reject(
        new Error("Video kaydedilemedi.")
      );
    });

    recorder.start();
    frameId = requestAnimationFrame(draw);

    const blob = await finished;
    cancelAnimationFrame(frameId);
    stream.getTracks().forEach(track => track.stop());

    if (!blob.size) {
      throw new Error("Video dosyası boş oluştu.");
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "slayt-videosu.webm";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    status.innerText =
      "Video hazır ve indiriliyor. Bu sürüm WebM formatındadır.";

  } catch (error) {
    status.innerText = "Hata: " + error.message;
  } finally {
    if (button) button.disabled = false;
  }
}
        
