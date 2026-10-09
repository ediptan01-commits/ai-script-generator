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
                error: "GEMINI_API_KEY sunucuda tanımlı değil."
            });
        }

        if (
            typeof operation !== "string" ||
            !operation.startsWith(
                "models/veo-3.1-generate-preview/operations/"
            )
        ) {
            return res.status(400).json({
                error: "Geçersiz video işlem bilgisi."
            });
        }

        // Önce videonun hazır olup olmadığını kontrol et
        const statusResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${operation}`,
            {
                headers: {
                    "x-goog-api-key": apiKey
                }
            }
        );

        const statusData = await statusResponse.json();

        if (!statusResponse.ok) {
            return res.status(statusResponse.status).json({
                error:
                    statusData?.error?.message ||
                    "Video durumu alınamadı."
            });
        }

        if (!statusData.done) {
            return res.status(202).json({
                error: "Video henüz hazır değil. Biraz sonra tekrar deneyin."
            });
        }

        if (statusData.error) {
            return res.status(500).json({
                error:
                    statusData.error.message ||
                    "Video üretimi başarısız oldu."
            });
        }

        const video =
            statusData.response
                ?.generateVideoResponse
                ?.generatedSamples?.[0]
                ?.video;

        if (!video?.uri) {
            return res.status(500).json({
                error: "İndirilecek video adresi bulunamadı."
            });
        }

        // Videoyu Google sunucusundan al
        const videoResponse = await fetch(video.uri, {
            headers: {
                "x-goog-api-key": apiKey
            },
            redirect: "follow"
        });

        if (!videoResponse.ok) {
            return res.status(502).json({
                error: "Video dosyası indirilemedi."
            });
        }

        const videoBuffer = Buffer.from(
            await videoResponse.arrayBuffer()
        );

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="yapay-zeka-videosu.mp4"'
        );
        res.setHeader("Cache-Control", "no-store");

        return res.status(200).send(videoBuffer);

    } catch (error) {
        console.error("Video indirme hatası:", error);

        return res.status(500).json({
            error: "Video indirilirken sunucu hatası oluştu."
        });
    }
}
