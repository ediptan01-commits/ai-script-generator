async function generateScript() {

    const apiKeyInput = document.getElementById('apiKey');

    const GEMINI_API_KEY =
        apiKeyInput.value.trim();

    const topic =
        document.getElementById('topic').value.trim();

    const language =
        document.getElementById('language').value;

    const resultBox =
        document.getElementById('result');


    if (GEMINI_API_KEY) {

        localStorage.setItem(
            'gemini_api_key',
            GEMINI_API_KEY
        );

    }


    if (!GEMINI_API_KEY) {

        alert(
            "Lütfen önce Gemini API anahtarınızı girin!"
        );

        return;
    }


    if (!topic) {

        alert(
            "Lütfen bir konu başlığı girin!"
        );

        return;
    }


    resultBox.style.display = "block";

    resultBox.innerText =
        "🧠 Yapay zeka senaryoyu hazırlıyor...";


    const promptText = `

Sen profesyonel bir TikTok, Instagram Reels ve YouTube Shorts senaristisin.

KONU:
${topic}

HEDEF DİL:
${language}

Yaklaşık 30 saniyelik, dikkat çekici ve viral olabilecek bir video senaryosu hazırla.

Şu formatı kullan:

🔥 VİRAL KANCALAR

1. İlk kanca
2. İkinci kanca
3. Üçüncü kanca


🎬 VİDEO SENARYOSU

Akıcı ve izleyiciyi videonun sonuna kadar tutacak senaryoyu yaz.


📱 EKRAN YAZILARI

Videoda gösterilecek kısa yazıları yaz.


🎯 ÇAĞRI

İzleyiciyi harekete geçirecek kısa bir çağrı yaz.


Gereksiz açıklama yapma.

Doğrudan kullanılabilecek kaliteli içerik üret.

`;


    try {

        const response = await fetch(

            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        GEMINI_API_KEY

                },


                body: JSON.stringify({

                    contents: [

                        {

                            parts: [

                                {

                                    text:
                                        promptText

                                }

                            ]

                        }

                    ],


                    generationConfig: {

                        maxOutputTokens:
                            1200

                    }

                })

            }

        );


        const data =
            await response.json();


        console.log(
            "Gemini cevabı:",
            data
        );


        if (!response.ok) {

            const errorMessage =
                data?.error?.message ||
                `Gemini API hatası (HTTP ${response.status})`;


            resultBox.innerText =
                "❌ Gemini Hatası:\n\n" +
                errorMessage;

            return;
        }


        const aiResult =
            data?.candidates?.[0]
                ?.content?.parts?.[0]?.text;


        if (!aiResult) {

            resultBox.innerText =
                "❌ Gemini'dan geçerli bir cevap alınamadı.";

            return;
        }


        resultBox.innerText =
            aiResult;


    } catch (error) {

        console.error(
            "Bağlantı hatası:",
            error
        );


        resultBox.innerText =
            "❌ Bağlantı hatası oluştu.\n\n" +
            "İnternet bağlantınızı kontrol edip tekrar deneyin.";

    }

}


/* -------------------------------- */
/* API KEY HATIRLAMA                */
/* -------------------------------- */

window.addEventListener(
    'DOMContentLoaded',
    () => {

        const savedKey =
            localStorage.getItem(
                'gemini_api_key'
            );


        if (savedKey) {

            document.getElementById(
                'apiKey'
            ).value = savedKey;

        }

    }
);


/* -------------------------------- */
/* VİDEO OLUŞTURMA PLANI            */
/* -------------------------------- */

async function createVideoPlan() {

    const apiKey =
        document.getElementById(
            'apiKey'
        ).value.trim();


    const topic =
        document.getElementById(
            'topic'
        ).value.trim();


    const language =
        document.getElementById(
            'language'
        ).value;


    const duration =
        document.getElementById(
            'duration'
        ).value;


    const platform =
        document.getElementById(
            'platform'
        ).value;


    const style =
        document.getElementById(
            'style'
        ).value;


    const status =
        document.getElementById(
            'videoStatus'
        );


    if (!apiKey) {

        alert(
            "Önce Gemini API anahtarınızı girin."
        );

        return;
    }


    if (!topic) {

        alert(
            "Önce video konusunu yazın."
        );

        return;
    }


    status.style.display =
        "block";


    status.innerText =
        "🎬 Video planı hazırlanıyor...";


    const prompt = `

Sen profesyonel bir kısa video yapımcısısın.

KONU:
${topic}

SÜRE:
${duration} saniye

PLATFORM:
${platform}

TARZ:
${style}

DİL:
${language}

Bu bilgilerle bir kısa video üretim planı hazırla.

Şu formatı kullan:

🎬 VİDEO BAŞLIĞI

🔥 VİRAL KANCA

🎙️ SESLENDİRME

🎥 SAHNE 1
Görsel açıklaması:
Ekran yazısı:

🎥 SAHNE 2
Görsel açıklaması:
Ekran yazısı:

🎥 SAHNE 3
Görsel açıklaması:
Ekran yazısı:

🎥 SAHNE 4
Görsel açıklaması:
Ekran yazısı:

🎯 SON ÇAĞRI

Her sahneyi kısa ve görsel olarak üretilebilir şekilde tarif et.

`;


    try {

        const response =
            await fetch(

                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            apiKey

                    },


                    body:
                        JSON.stringify({

                            contents: [

                                {

                                    parts: [

                                        {

                                            text:
                                                prompt

                                        }

                                    ]

                                }

                            ],

                            generationConfig: {

                                maxOutputTokens:
                                    1600

                            }

                        })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            status.innerText =
                "❌ Gemini Hatası:\n\n" +
                (
                    data?.error?.message ||
                    "Bilinmeyen hata"
                );

            return;
        }


        const result =
            data?.candidates?.[0]
                ?.content?.parts?.[0]?.text;


        if (!result) {

            status.innerText =
                "❌ Video planı oluşturulamadı.";

            return;
        }


        status.innerText =
            "✅ Video planı hazır!\n\n" +
            result;


    } catch (error) {

        console.error(error);


        status.innerText =
            "❌ Bağlantı hatası oluştu.";

    }

}
