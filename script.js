async function generateScript() {
    // Anahtarı artık koddan değil, ekrandaki kutudan güvenli bir şekilde alıyoruz
    const GEMINI_API_KEY = document.getElementById('apiKey').value;
    const topic = document.getElementById('topic').value;
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
    resultBox.innerText = "Yapay zeka viral kancaları düşünüyor... 🚀";

    const promptText = `Sen viral bir TikTok ve Instagram Reels içerik üreticisisin. 
    Lütfen şu konu hakkında ${language} dilinde bir içerik üret: "${topic}".
    Çıktı formatı tam olarak şu şekilde olsun:
    
    🔥 VİRAL KANCALAR (İlk 3 Saniye İçin 3 Alternatif):
    1- [Kanca 1]
    2- [Kanca 2]
    3- [Kanca 3]
    
    🎬 30 SANİYELİK VİDEO SENARYOSU:
    [Buraya akıcı, dinamik ve izleyiciyi tutacak bir video senaryosu yaz]`;

    const url = `https://googleapis.com{GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }]
            })
        });

        const data = await response.json();
        
        // Gemini'den gelen metni alıyoruz
        const aiResult = data.candidates[0].content.parts[0].text;
        
        resultBox.innerText = aiResult;

    } catch (error) {
        console.error("Hata oluştu:", error);
        resultBox.innerText = "Bir hata oluştu. Lütfen API anahtarınızın doğruluğunu veya internet bağlantınızı kontrol edin.";
    }
}
