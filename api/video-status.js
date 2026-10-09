
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Sadece POST isteği kabul edilir."
        });
    }

    try {
        const { operation } = req.body || {};
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY tanımlı değil."
            });
        }

        if (
            typeof operation !== "string" ||
            !operation.startsWith("models/")
        ) {
            return res.status(400).json({
                error: "Geçersiz video işlem bilgisi."
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${operation}`,
            {
                headers: {
                    "x-goog-api-key": apiKey
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Video durumu alınamadı."
            });
        }

        if (!data.done) {
            return res.status(200).json({
                done: false,
                message: "Video hazırlanıyor..."
            });
        }

        if (data.error) {
            return res.status(200).json({
                done: true,
                error: data.error.message ||
                    "Video üretimi başarısız oldu."
            });
        }

        const video =
            data.response
                ?.generateVideoResponse
                ?.generatedSamples?.[0]
                ?.video;

        if (!video?.uri) {
            return res.status(200).json({
                done: true,
                error: "Video hazır bilgisi geldi ancak video adresi bulunamadı."
            });
        }

        return res.status(200).json({
            done: true,
            videoUrl: video.uri
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message ||
                "Sunucu hatası oluştu."
        });
    }
}
