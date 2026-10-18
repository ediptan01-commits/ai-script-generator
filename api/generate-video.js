// Gemini scenario endpoint. The API key stays on the Vercel server.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Yalnızca POST isteği kabul edilir." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Vercel'de GEMINI_API_KEY tanımlı değil." });

  const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
  const language = typeof req.body?.language === "string" ? req.body.language.trim() : "Turkish";
  if (!topic || topic.length > 500) return res.status(400).json({ error: "Konu boş olamaz ve en fazla 500 karakter olabilir." });
  const allowedLanguages = new Set(["Turkish", "English", "Spanish", "German"]);
  const safeLanguage = allowedLanguages.has(language) ? language : "Turkish";

  try {
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "Sen profesyonel bir kısa video senaristisin. Sadece istenen senaryoyu yaz; gereksiz açıklama ekleme." }] },
        contents: [{ role: "user", parts: [{ text: `KONU: ${topic}\nDİL: ${safeLanguage}\n\nŞu bölümleri hazırla:\n1. Dikkat çekici bir giriş\n2. Yaklaşık 30 saniyelik video senaryosu, sahne sahne\n3. Ekranda gösterilecek kısa yazılar\n4. İzleyiciyi harekete geçiren kapanış` }] }],
        generationConfig: { maxOutputTokens: 1200 }
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("Gemini scenario API error:", data?.error?.message || upstream.status);
      const throttled = upstream.status === 429;
      return res.status(throttled ? 429 : 502).json({
        error: throttled ? "Gemini kullanım sınırına ulaşıldı. Biraz sonra tekrar deneyin." : "Gemini senaryo üretemedi. Vercel Function Logs bölümünü kontrol edin."
      });
    }
    const script = (data.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("\n").trim();
    if (!script) return res.status(502).json({ error: "Gemini boş senaryo döndürdü. Konuyu değiştirip tekrar deneyin." });
    return res.status(200).json({ script });
  } catch (error) {
    console.error("Gemini scenario endpoint error:", error);
    return res.status(502).json({ error: "Gemini bağlantısı kurulamadı. Lütfen tekrar deneyin." });
  }
};
