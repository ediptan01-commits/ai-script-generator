// Vercel serverless endpoint: OpenAI key stays on the server.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Yalnızca POST isteği kabul edilir." });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Sunucuda OpenAI anahtarı tanımlı değil. Vercel'de OPENAI_API_KEY ayarlanmalı." });
  const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
  const language = typeof req.body?.language === "string" ? req.body.language.trim() : "Turkish";
  if (!topic || topic.length > 500) return res.status(400).json({ error: "Konu boş olamaz ve en fazla 500 karakter olabilir." });
  const allowedLanguages = new Set(["Turkish", "English", "Spanish", "German"]);
  const safeLanguage = allowedLanguages.has(language) ? language : "Turkish";
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions: "Sen profesyonel bir kısa video senaristisin. Sadece istenen senaryoyu yaz; gereksiz açıklama ekleme.",
        input: `KONU: ${topic}\nDİL: ${safeLanguage}\n\nŞu bölümleri hazırla:\n1. Dikkat çekici bir giriş\n2. Yaklaşık 30 saniyelik video senaryosu\n3. Ekranda gösterilecek kısa yazılar\n4. İzleyiciyi harekete geçiren kapanış`,
        max_output_tokens: 1200
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error:", data?.error?.message || response.status);
      return res.status(response.status === 429 ? 429 : 502).json({
        error: response.status === 429 ? "OpenAI kullanım sınırına ulaşıldı. Biraz sonra tekrar deneyin." : "OpenAI senaryo üretemedi. Vercel Function Logs bölümündeki hatayı kontrol edin."
      });
    }
    const script = (data.output || []).flatMap(item => item.content || [])
      .filter(item => item.type === "output_text").map(item => item.text || "").join("\n").trim();
    if (!script) return res.status(502).json({ error: "OpenAI boş senaryo döndürdü." });
    return res.status(200).json({ script });
  } catch (error) {
    console.error("Scenario endpoint error:", error);
    return res.status(502).json({ error: "OpenAI bağlantısı kurulamadı. Lütfen tekrar deneyin." });
  }
};
