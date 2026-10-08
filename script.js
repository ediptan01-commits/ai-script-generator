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

    const promptText = `Sen viral TikTok, Instagram Reels ve YouTube Shorts içerik üreticisisin.

Şu konu hakkında ${language} dilinde, yaklaşık 30 saniyelik etkili bir video içeriği üret:

"${topic}"

Çıktı formatı tam olarak şu şekilde olsun:

🔥 VİRAL KANCALAR (İlk 3 Saniye İçin 3 Alternatif):
1- [Kanca 1]
2- [Kanca 2]
3- [Kanca 3]

🎬 30 SANİYELİK VİDEO SENARYOSU:
[Akıcı, dinamik ve izleyiciyi videonun sonuna kadar tutacak senaryo]

📱 EKRAN YAZILARI:
[Video sırasında gösterilecek kısa metinler]

🎯 ÇAĞRI:
[İzleyiciyi harekete geçirecek kısa çağrı]

Gereksiz açıklama yapma. Doğrudan kullanılabilecek kaliteli bir senaryo üret.`;

    try {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },

            body: JSON.stringify({
                model: "gpt-5.6-luna",
                input: promptText,
                max_output_tokens: 1200
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenAI API hatası:", data);

            const message =
                data?.error?.message ||
                `OpenAI API hatası (HTTP ${response.status})`;

            resultBox.innerText = "Hata: " + message;
            return;
        }

        const aiResult = data.output_text;

        if (!aiResult) {
            console.error("Beklenmeyen OpenAI cevabı:", data);
            resultBox.innerText =
                "OpenAI'dan geçerli bir metin cevabı alınamadı.";
            return;
        }

        resultBox.innerText = aiResult;

    } catch (error) {
        console.error("Bağlantı hatası:", error);

        resultBox.innerText =
            "Bağlantı hatası oluştu. İnternet bağlantınızı kontrol edin ve tekrar deneyin.";
    }
}
