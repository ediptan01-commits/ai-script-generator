
/* ==========================================
   SENARYO ÜRETİMİ
========================================== */

async function generateScript() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const topic = document.getElementById("topic").value.trim();
  const language = document.getElementById("language").value;
  const resultBox = document.getElementById("result");
  const button = document.querySelector('button[onclick="generateScript()"]');

  if (!apiKey) {
    alert("Lütfen Gemini API anahtarını gir.");
    return;
  }

  if (!topic) {
    alert("Lütfen video konusunu yaz.");
    return;
  }

  resultBox.style.display = "block";
  resultBox.innerText = "Senaryo hazırlanıyor...";
  if (button) button.disabled = true;

  try {
    const prompt = `
Sen profesyonel bir kısa video senaristisin.

KONU: ${topic}
DİL: ${language}

Şu bölümleri hazırla:
1. Dikkat çekici bir giriş
2. Yaklaşık 30 saniyelik video senaryosu
3. Ekranda gösterilecek kısa yazılar
4. İzleyiciyi harekete geçiren kapanış

Gereksiz açıklama ekleme.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1200
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message || `API hatası: ${response.status}`
      );
    }

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!answer) {
      throw new Error("Senaryo cevabı boş geldi.");
    }

    resultBox.innerText = answer;

  } catch (error) {
    resultBox.innerText = "Hata: " + error.message;
  } finally {
    if (button) button.disabled = false;
  }
}


/* ==========================================
   KAYITLI API ANAHTARINI YÜKLE
========================================== */

window.addEventListener("DOMContentLoaded", () => {
  const savedKey = localStorage.getItem("gemini_api_key");
  const input = document.getElementById("apiKey");

  if (savedKey && input) {
    input.value = savedKey;
  }

  if (input) {
    input.addEventListener("change", () => {
      localStorage.setItem("gemini_api_key", input.value.trim());
    });
  }
});


/* ==========================================
   ÜCRETSİZ SLAYT VİDEOSU
========================================== */

async function createVideoPlan() {
  const topic = document.getElementById("topic").value.trim();
  const duration = Number(
    document.getElementById("duration").value || 15
  );
  const style = document.getElementById("style").value;
  const status = document.getElementById("videoStatus");
  const resultBox = document.getElementById("result");
  const button = document.querySelector(".video-button");

  if (!topic) {
    alert("Önce video konusunu yaz.");
    return;
  }

  status.style.display = "block";

  if (!window.MediaRecorder ||
      !HTMLCanvasElement.prototype.captureStream) {
    status.innerText =
      "Bu tarayıcı video kaydını desteklemiyor. Android Chrome ile deneyin.";
    return;
  }

  if (button) button.disabled = true;

  let stream = null;
  let frameId = null;
  let recorder = null;

  try {
    const scriptText = resultBox
      ? resultBox.innerText.trim()
      : "";

    const sentences = scriptText.startsWith("Hata:")
      ? []
      : scriptText
          .split(/[.!?\n]+/)
          .map(item => item.trim())
          .filter(item =>
            item.length > 10 &&
            item !== "Senaryo hazırlanıyor..."
          );

    const slides = [topic, ...sentences.slice(0, 6)];

    const fallbackSlides = [
      "Bu konuda bilmen gereken önemli ayrıntılar",
      "En sık yapılan hatalara dikkat et",
      "Sen bu konuda ne düşünüyorsun?"
    ];

    while (slides.length < 4) {
      slides.push(
        fallbackSlides[(slides.length - 1) % fallbackSlides.length]
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Video çizim alanı oluşturulamadı.");
    }

    stream = canvas.captureStream(25);

    let mime = "";

    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mime = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mime = "video/webm";
    } else {
      throw new Error("Bu cihaz WebM video kaydını desteklemiyor.");
    }

    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 2500000
    });

    const chunks = [];
    recorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    const secondsPerSlide = duration / slides.length;
    let startTime = null;
    let stopped = false;

    const finished = new Promise((resolve, reject) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mime }));
      };

      recorder.onerror = () => {
        reject(new Error("Video kaydı başarısız oldu."));
      };
    });

    function draw(now) {
      if (stopped) return;

      if (startTime === null) {
        startTime = now;
      }

      const elapsed = (now - startTime) / 1000;

      if (elapsed >= duration) {
        stopped = true;
        recorder.stop();
        return;
      }

      const index = Math.min(
        slides.length - 1,
        Math.floor(elapsed / secondsPerSlide)
      );

      const localTime = elapsed % secondsPerSlide;

      const palettes = [
        ["#0f172a", "#075985"],
        ["#1e1b4b", "#7e22ce"],
        ["#052e16", "#15803d"],
        ["#431407", "#c2410c"],
        ["#172554", "#4338ca"]
      ];

      const colors = palettes[index % palettes.length];
      const gradient = ctx.createLinearGradient(
        0, 0, 720, 1280
      );

      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 720, 1280);

      // Hareketli dekor
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

      // Üst başlık
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "bold 25px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        "KISA VİDEO • " + (index + 1) + "/" + slides.length,
        55,
        470
      );

      // Slayt metnini satırlara böl
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

      let y = 570 + Math.sin(localTime * 1.5) * 5;

      lines.slice(0, 7).forEach(row => {
        ctx.fillText(row, 55, y);
        y += 65;
      });

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "24px Arial";
      ctx.fillText(style + " • Dikey 9:16", 55, 1150);

      // İlerleme çubuğu
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(55, 1190, 610, 7);

      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(
        55,
        1190,
        610 * Math.min(1, elapsed / duration),
        7
      );

      status.innerText =
        "Slayt videosu hazırlanıyor: %" +
        Math.min(99, Math.floor(elapsed / duration * 100));

      frameId = requestAnimationFrame(draw);
    }

    status.innerText = "Video kaydı başlatılıyor...";

    recorder.start();
    frameId = requestAnimationFrame(draw);

    const blob = await finished;

    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }

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
      "Video hazır. İndirme başlatıldı. Format: WebM.";

  } catch (error) {
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch (_) {}
    }

    status.innerText = "Hata: " + error.message;

  } finally {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    if (button) button.disabled = false;
  }
}
