async function generateScript() {
    const OPENAI_API_KEY = document.getElementById('apiKey').value.trim();
    const topic = document.getElementById('topic').value.trim();
    const language = document.getElementById('language').value;
    const resultBox = document.getElementById('result');

    if (!OPENAI_API_KEY) {
        alert("Lütfen önce OpenAI API anahtarınızı girin!");
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

Gereksiz açıklama yapma. Doğrudan kullanılabilecek kaliteli bir içerik üret.
`;

    try {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + OPENAI_API_KEY
            },

            body: JSON.stringify({
                model: "gpt-5-mini",
                input: promptText,
                max_output_tokens: 1200
            })
        });

        const data = await response.json();

        console.log("OpenAI cevabı:", data);

        if (!response.ok) {
            const errorMessage =
                data?.error?.message ||
                "OpenAI API isteği başarısız oldu.";

            resultBox.innerText =
                "❌ OpenAI Hatası:\n\n" + errorMessage;

            return;
        }

        if (!data.output_text) {
            resultBox.innerText =
                "❌ OpenAI'dan metin cevabı alınamadı.";

            return;
        }

        resultBox.innerText = data.output_text;

    } catch (error) {
        console.error("Bağlantı hatası:", error);

        resultBox.innerText =
            "❌ Bağlantı hatası oluştu.\n\n" +
            "İnternet bağlantınızı kontrol edip tekrar deneyin.";
    }
}
