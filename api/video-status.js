// Gemini Veo video jobs. The Gemini API key stays on the Vercel server.
const GOOGLE_API = "https://generativelanguage.googleapis.com/v1beta";

function getVideoUri(operation) {
  return operation?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri || "";
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Vercel'de GEMINI_API_KEY tanımlı değil." });

  if (req.method === "POST") {
    const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
    const script = typeof req.body?.script === "string" ? req.body.script.trim() : "";
    const style = typeof req.body?.style === "string" ? req.body.style.slice(0, 80) : "Profesyonel";
    const platform = typeof req.body?.platform === "string" ? req.body.platform.slice(0, 80) : "TikTok";
    if (!topic || topic.length > 300 || !script || script.length > 5000) {
      return res.status(400).json({ error: "Konu ve üretilmiş senaryo gerekli. Senaryo en fazla 5000 karakter olabilir." });
    }

    const prompt = [
      "Create one coherent, cinematic, realistic vertical 9:16 short video for social media.",
      `Topic: ${topic}`,
      `Style: ${style}. Platform: ${platform}.`,
      `Use this script as the story and visual brief: ${script}`,
      "Show natural motion, a clear subject action, and polished camera movement. Keep the scene visually continuous.",
      "Do not render captions, subtitles, logos, written words, or UI in the image."
    ].join("\n").slice(0, 4000);

    try {
      const upstream = await fetch(`${GOOGLE_API}/models/veo-3.1-generate-preview:predictLongRunning`, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          // Veo returns one video per request; numberOfVideos is not accepted
          // for this text-to-video request.
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
      return res.status(202).json({ id: data.name, status: "in_progress", progress: 0 });
    } catch (error) {
      console.error("Gemini Veo create request failed:", error);
      return res.status(502).json({ error: "Gemini video servisine bağlanılamadı." });
    }
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Yalnızca GET ve POST istekleri kabul edilir." });
  }

  const id = typeof req.query?.id === "string" ? req.query.id : "";
  // Only accept operation resource names, never arbitrary URLs or paths.
  if (!/^(?:operations|models)\/[A-Za-z0-9._:/-]+$/.test(id)) {
    return res.status(400).json({ error: "Geçersiz video işlem numarası." });
  }

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
      return res.status(200).json({ id, status: "failed", progress: 0, error: "Gemini video üretimi tamamlanamadı. Konuyu değiştirip tekrar deneyin." });
    }

    if (req.query?.download === "1") {
      if (!operation.done) return res.status(409).json({ error: "Video henüz hazır değil." });
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

    return res.status(200).json({
      id,
      status: operation.done ? "completed" : "in_progress",
      progress: operation.done ? 100 : 0
    });
  } catch (error) {
    console.error("Gemini Veo status/download failed:", error);
    if (!res.headersSent) return res.status(502).json({ error: "Video bilgisi alınamadı. Lütfen tekrar deneyin." });
    return res.end();
  }
};
