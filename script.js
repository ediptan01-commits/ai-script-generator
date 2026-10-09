async function generateScript() {
    // Bilgileri ekrandaki elementlerden alıyoruz
    const GEMINI_API_KEY = document.getElementById('apiKey').value;
    const topic = document.getElementById('topic').value;
    const language = document.getElementById('language').value;
    
    // Tasarıma eklediğiniz yeni alanları da koda dahil ediyoruz
    const duration = document.getElementById('duration')?.value || "30 saniye";
    const platform = document.getElementById('platform')?.value || "TikTok";
    const style = document.getElementById('style')?.value || "Viral";
    
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

    const promptText = `Sen viral bir ${platform} içerik üreticisisin. 
    Lütfen şu konu hakkında ${language} dilinde, ${style} tarzında ve ${duration} sürecek bir içerik üret: "${topic}".
    Çıktı formatı tam olarak şu şekilde olsun:
    
    🔥 VİRAL KANCALAR (İlk 3 Saniye İçin 3 Alternatif):
    1- [Kanca 1]
    2- [Kanca 2]
    3- [Kanca 3]
    
    🎬 VİDEO SENARYOSU:
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

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status}`);
        }

        const data = await response.json();
        
        // KESİN ÇÖZÜM: Gemini API'den gelen metni hata vermeden okuyan doğru JSON dizilimi budur:
        const aiResult = data.candidates[0].content.parts[0].text;
        
        resultBox.innerText = aiResult;

    } catch (error) {
        console.error("Hata ayrıntısı:", error);
        // Ekranda çirkin kod hataları yerine kullanıcı dostu uyarı gösteriyoruz
        if(resultBox.innerText.includes("düşünüyor")) {
            resultBox.innerText = "Bir hata oluştu. Lütfen Gemini API anahtarınızın doğruluğunu veya internet bağlantınızı kontrol edin.";
        }
    }
}
