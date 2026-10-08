async function generateScript() {
    const GEMINI_API_KEY = document.getElementById('apiKey').value.trim();
    const topic = document.getElementById('topic').value.trim();
    const language = document.getElementById('language').value;
    const resultBox = document.getElementById('result');

    if (!GEMINI_API_KEY) {
        alert("Lütfen önce Gemini API anahtarınızı girin!");
        return;
    }

    if (!topic) {
        alert("Lütfen bir konu başlığı girin!");
        return;
    }

    resultBox.style.display = "block";
    resultBox.innerText = "Yapay zeka senaryoyu hazırlıyor...";

    const promptText = `
Sen profesyonel bir TikTok, Instagram Reels ve YouTube Shorts senaristisin.

Konu:
${topic}

Hedef dil:
${language}

Yaklaşık 30 saniyelik, dikkat çekici ve viral olabilecek bir video senaryosu hazırla.

Çıktıyı şu formatta ver:

🔥 VİRAL KANCALAR
1. İlk kanca
2. İkinci kanca
3. Üçüncü kanca

🎬 30 SANİYELİK VİDEO SENARYOSU
Akıcı ve izleyiciyi videonun sonuna kadar tutacak senaryoyu yaz.

📱 EKRAN YAZILARI
Videoda gösterilecek kısa yazıları yaz.

🎯 ÇAĞRI
İzleyiciyi harekete geçirecek kısa bir çağrı yaz.

Gereksiz açıklama yapma.
Doğrudan kullanılabilecek kaliteli bir içerik üret.
`;

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: promptText
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1200,
                    }
                })
            }
        );

        const data = await response.json();

        console.log("Gemini cevabı:", data);

        if (!response.ok) {
            const errorMessage =
                data?.error?.message ||
                `Gemini API hatası (HTTP ${response.status})`;

            resultBox.innerText =
                "❌ Gemini Hatası:\n\n" + errorMessage;

            return;
        }

        const aiResult =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResult) {
            console.error("Beklenmeyen Gemini cevabı:", data);

            resultBox.innerText =
                "❌ Gemini'dan geçerli bir metin cevabı alınamadı.";

            return;
        }

        resultBox.innerText = aiResult;

    } catch (error) {
        console.error("Bağlantı hatası:", error);

        resultBox.innerText =
            "❌ Bağlantı hatası oluştu.\n\n" +
            "İnternet bağlantınızı kontrol edip tekrar deneyin.";
    }
}
