// ÖNEMLİ NOT: Test için kendi OpenAI API anahtarınızı buraya yazabilirsiniz.
const OPENAI_API_KEY = "BURAYA_OPENAI_API_KEY_GELECEK"; 

async function generateScript() {
    const topic = document.getElementById('topic').value;
    const language = document.getElementById('language').value;
    const resultBox = document.getElementById('result');

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

    try {
        const response = await fetch("https://openai.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", 
                messages: [{ role: "user", content: promptText }],
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        // Düzeltilen kısım: API'den gelen metni doğru almak için [0] indeksini kullanıyoruz
        const aiResult = data.choices[0].message.content;
        
        resultBox.innerText = aiResult;

    } catch (error) {
        console.error("Hata oluştu:", error);
        resultBox.innerText = "Bir hata oluştu. Lütfen API anahtarınızı kontrol edin.";
    }
}
