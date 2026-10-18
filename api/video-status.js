// Gemini Veo generation and automatic video-extension flow.
// The API key stays on the Vercel server.
const GOOGLE_API = "https://generativelanguage.googleapis.com/v1beta";
const ALLOWED_DURATIONS = new Set([8, 15, 22, 29]);

function getVideoUri(operation) {
  return operation?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri || "";
}

async function startExtension(apiKey, sourceOperation, topic, script, style, platform, extensionNumber) {
  const videoUri = getVideoUri(sourceOperation);
  if (!videoUri) throw new Error("Önceki Veo videosunun dosya bağlantısı bulunamadı.");

  const videoResponse = await fetch(videoUri, { headers: { "x-goog-api-key": apiKey } });
  if (!videoResponse.ok) throw new Error(`Önceki video uzatma için indirilemedi (HTTP ${videoResponse.status}).`);
  const videoBytes = Buffer.from(await videoResponse.arrayBuffer());
  if (!videoBytes.length) throw new Error("Önceki Veo videosu boş döndü.");

  const prompt = [
    "Continue the supplied Veo-generated video seamlessly from its final moment.",
    "Preserve the same characters, location, visual style, lighting, camera language, and audio continuity.",
    "Advance the story naturally; do not restart, repeat the opening, add titles, or create a slideshow.",
    `This is continuation ${extensionNumber} of the same short social video. Topic: ${topic}.`,
    `Style: ${style}. Platform: ${platform}.`,
    `Continue and resolve the story using this scenario as guidance: ${script}`
  ].join("\n").slice(0, 4000);

  const upstream = await fetch(`${GOOGLE_API}/models/veo-3.1-generate-preview:predictLongRunning`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{
        prompt,
        video: { inlineData: { mimeType: "video/mp4", data: videoBytes.toString("base64") } }
      }],
      // numberOfVideos is supported for Veo extension requests (unlike the initial text-to-video request).
      parameters: { numberOfVideos: 1, resolution: "720p" }
    })
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok || !data.name) {
    console.error("Gemini Veo extension error:", data?.error?.message || upstream.status);
    const error = new Error(data?.error?.message || `HTTP ${upstream.status}`);
    error.status = upstream.status;
    throw error;
  }
  return data.name;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Vercel'de GEMINI_API_KEY tanımlı değil." });
  const isStatusPoll = req.method === "POST" && req.body?.action === "status";

  if (req.method === "POST" && !isStatusPoll) {
    const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
    const script = typeof req.body?.script === "string" ? req.body.script.trim() : "";
    const style = typeof req.body?.style === "string" ? req.body.style.slice(0, 80) : "Profesyonel";
    const platform = typeof req.body?.platform === "string" ? req.body.platform.slice(0, 80) : "TikTok";
    const targetSeconds = Number(req.body?.seconds || 8);
    if (!topic || topic.length > 300 || !script || script.length > 5000) {
      return res.status(400).json({ error: "Konu ve üretilmiş senaryo gerekli. Senaryo en fazla 5000 karakter olabilir." });
    }
    if (!ALLOWED_DURATIONS.has(targetSeconds)) {
      return res.status(400).json({ error: "Video süresi 8, 15, 22 veya 29 saniye olmalı." });
    }

    const prompt = [
      "Create the opening 8-second segment of a coherent, cinematic, realistic vertical 9:16 short video for social media.",
      `Topic: ${topic}`,
      `Style: ${style}. Platform: ${platform}.`,
      `Begin the story using this scenario; leave it ready to continue naturally: ${script}`,
      "Show natural motion, a clear subject action, and polished camera movement.",
      "Do not render captions, subtitles, logos, written words, or UI in the image."
    ].join("\n").slice(0, 4000);

    try {
      const upstream = await fetch(`${GOOGLE_API}/models/veo-3.1-generate-preview:predictLongRunning`, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { aspectRatio: "9:16", resolution: "720p" }
        })
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok || !data.name) {
        console.error("Gemini Veo create error:", data?.error?.message || upstream.status);
        return res.status(upstream.status === 429 ? 429 : 502).json({
          error: upstream.status === 429
            ? "Gemini video kullanım sınırına ulaşıldı. Biraz sonra tekrar deneyin."
            : "Gemini Veo video üretimini başlatamadı. API erişimi ve Vercel Function Logs kontrol edilmeli."
        });
      }
      return res.status(202).json({ id: data.name, status: "in_progress", progress: 0, step: 0, seconds: targetSeconds });
    } catch (error) {
      console.error("Gemini Veo create request failed:", error);
      return res.status(502).json({ error: "Gemini video servisine bağlanılamadı." });
    }
  }

  if (req.method !== "GET" && !isStatusPoll) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Yalnızca GET ve POST istekleri kabul edilir." });
  }

  const requestData = isStatusPoll ? req.body : req.query;
  const id = typeof requestData?.id === "string" ? requestData.id : "";
  if (!/^(?:operations|models)\/[A-Za-z0-9._:/-]+$/.test(id)) {
    return res.status(400).json({ error: "Geçersiz video işlem numarası." });
  }
  const targetSeconds = Number(requestData?.seconds || 8);
  const step = Number(requestData?.step || 0);
  if (!ALLOWED_DURATIONS.has(targetSeconds) || !Number.isInteger(step) || step < 0) {
    return res.status(400).json({ error: "Video uzatma isteği geçersiz." });
  }
  const extensionCount = Math.round((targetSeconds - 8) / 7);
  if (step > extensionCount) return res.status(400).json({ error: "Video uzatma aşaması geçersiz." });

  try {
    const upstream = await fetch(`${GOOGLE_API}/${encodeURI(id)}`, {
      headers: { "x-goog-api-key": apiKey }
    });
    const operation = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("Gemini Veo status error:", operation?.error?.message || upstream.status);
      return res.status(502).json({ error: "Gemini video durumu alınamadı. Biraz sonra tekrar deneyin." });
    }
    if (operation.error) {
      console.error("Gemini Veo generation error:", operation.error.message || operation.error);
      return res.status(200).json({ id, step, status: "failed", progress: 0, error: "Gemini video üretimi tamamlanamadı. Konuyu değiştirip tekrar deneyin." });
    }

    if (requestData?.download === "1") {
      if (!operation.done || step !== extensionCount) return res.status(409).json({ error: "Video henüz hazır değil." });
      const videoUri = getVideoUri(operation);
      if (!videoUri) return res.status(502).json({ error: "Gemini hazır video dosyasını döndürmedi." });
      const videoResponse = await fetch(videoUri, { headers: { "x-goog-api-key": apiKey } });
      if (!videoResponse.ok) {
        console.error("Gemini Veo video download error:", videoResponse.status);
        return res.status(502).json({ error: "Gemini MP4 dosyasını indirmeye izin vermedi." });
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", 'attachment; filename="gemini-yapay-zeka-videosu.mp4"');
      if (videoResponse.body) {
        const reader = videoResponse.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.write(Buffer.from(value))) await new Promise(resolve => res.once("drain", resolve));
        }
      }
      return res.end();
    }

    if (!operation.done) {
      return res.status(200).json({ id, step, status: "in_progress", progress: Math.round((step / (extensionCount + 1)) * 90) });
    }

    if (step < extensionCount) {
      const script = typeof requestData?.script === "string" ? requestData.script : "";
      // The browser sends scenario data only while polling; reject oversized values.
      if (!script || script.length > 5000) return res.status(400).json({ error: "Video senaryosu uzatma için bulunamadı. Lütfen yeniden deneyin." });
      const topic = typeof requestData?.topic === "string" ? requestData.topic.slice(0, 300) : "";
      const style = typeof requestData?.style === "string" ? requestData.style.slice(0, 80) : "Profesyonel";
      const platform = typeof requestData?.platform === "string" ? requestData.platform.slice(0, 80) : "TikTok";
      const nextStep = step + 1;
      const nextId = await startExtension(apiKey, operation, topic, script, style, platform, nextStep);
      return res.status(200).json({
        id: nextId,
        step: nextStep,
        status: "in_progress",
        progress: Math.round((nextStep / (extensionCount + 1)) * 90)
      });
    }

    return res.status(200).json({ id, step, status: "completed", progress: 100 });
  } catch (error) {
    console.error("Gemini Veo extension/status failed:", error);
    const status = error.status === 429 ? 429 : 502;
    if (!res.headersSent) {
      return res.status(status).json({
        error: status === 429
          ? "Gemini video kullanım sınırına ulaşıldı. Biraz sonra tekrar deneyin."
          : "Video uzatılamadı. Vercel Function Logs bölümündeki Gemini Veo hatasını kontrol edin."
      });
    }
    return res.end();
  }
};
