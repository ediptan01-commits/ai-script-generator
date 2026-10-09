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
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(videoUrl), 60000);

        status.innerText = "✅ Video hazır! MP4 indirme işlemi başlatıldı.";

        return;
      }
    }

    status.innerText =
      "⏳ Video henüz tamamlanmadı. Daha sonra tekrar kontrol et.";
  } catch (error) {
    console.error("Video üretim hatası:", error);
    status.innerText = "❌ " + error.message;
  }
}
