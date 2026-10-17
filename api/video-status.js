// OpenAI Sora 2 video jobs. The API key stays on the Vercel server.
const OPENAI_URL = "https://api.openai.com/v1";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Vercel'de OPENAI_API_KEY ayarlanmamış." });
  }

  if (req.method === "POST") {
    const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
    const script = typeof req.body?.script === "string" ? req.body.script.trim() : "";
    const style = typeof req.body?.style === "string" ? req.body.style : "Profesyonel";
    const platform = typeof req.body?.platform === "string" ? req.body.platform : "TikTok";
    const seconds = String(req.body?.seconds || "8");

    if (!topic || topic.length > 300 || !script || script.length > 5000) {
      return res.status(400).json({ error: "Konu ve üretilmiş senaryo gerekli. Senaryo en fazla 5000 karakter olabilir." });
    }
    if (!["8", "16", "20"].includes(seconds)) {
      return res.status(400).json({ error: "Video süresi 8, 16 veya 20 saniye olmalı." });
    }

    const prompt = [
      "Create one coherent, cinematic, realistic vertical 9:16 short video for social media.",
      `Topic: ${topic}`,
      `Style: ${style}. Platform: ${platform}.`,
      `Use this script as the story and visual brief: ${script}`,
      "Show natural motion, clear subject action, and polished camera movement. Keep the scene visually continuous.",
      "Do not render captions, subtitles, logos, written words, or UI in the image."
    ].join("\n").slice(0, 4000);

    try {
      const upstream = await fetch(`${OPENAI_URL}/videos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "sora-2",
          prompt,
          size: "720x1280",
          seconds
        })
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        console.error("OpenAI video create error:", data?.error?.message || upstream.status);
        const status = upstream.status === 429 ? 429 : 502;
        return res.status(status).json({
          error: upstream.status === 429
            ? "OpenAI video kullanım sınırına ulaşıldı. Biraz sonra tekrar deneyin."
            : "OpenAI video üretimini başlatamadı. API hesabı, model erişimi ve Vercel Function Logs kontrol edilmeli."
        });
      }
      return res.status(202).json({ id: data.id, status: data.status, progress: data.progress || 0 });
    } catch (error) {
      console.error("Video create request failed:", error);
      return res.status(502).json({ error: "OpenAI video servisine bağlanılamadı." });
    }
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Yalnızca GET ve POST istekleri kabul edilir." });
  }

  const id = typeof req.query?.id === "string" ? req.query.id : "";
  if (!/^video_[A-Za-z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: "Geçersiz video numarası." });
  }

  try {
    if (req.query?.download === "1") {
      const upstream = await fetch(`${OPENAI_URL}/videos/${encodeURIComponent(id)}/content`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!upstream.ok) {
        console.error("OpenAI video download error:", upstream.status);
        return res.status(502).json({ error: "OpenAI MP4 dosyasını indirmeye izin vermedi." });
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", 'attachment; filename="openai-yapay-zeka-videosu.mp4"');
      if (upstream.body) {
        const reader = upstream.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.write(Buffer.from(value))) {
            await new Promise(resolve => res.once("drain", resolve));
          }
        }
      }
      return res.end();
    }

    const upstream = await fetch(`${OPENAI_URL}/videos/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(502).json({ error: "OpenAI video durumu alınamadı." });
    }
    return res.status(200).json({
      id: data.id,
      status: data.status,
      progress: data.progress || 0,
      error: data.error?.message || null
    });
  } catch (error) {
    console.error("Video status/download failed:", error);
    if (!res.headersSent) return res.status(502).json({ error: "Video bilgisi alınamadı." });
    return res.end();
  }
};
