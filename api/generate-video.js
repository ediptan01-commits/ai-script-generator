export default async function handler(req, res) {

    // Sadece POST kabul et
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Sadece POST isteği kabul edilir."
        });
    }

    try {

        const { topic, style, duration } = req.body || {};

        if (!topic) {
            return res.status(400).json({
                error: "Video konusu belirtilmedi."
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY sunucuda tanımlı değil."
            });
        }

        const prompt = `
Create a vertical 9:16 social media video.

Topic:
${topic}

Style:
${style || "Viral"}

Target duration:
${duration || 8} seconds.

Make it dynamic, visually attractive and suitable for TikTok,
Instagram Reels and YouTube Shorts.

Use cinematic camera movement, strong visual storytelling,
fast pacing and engaging action.

Do not add subtitles or text overlays unless they are naturally
part of the scene.

Generate native audio and suitable sound effects.
`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-lite-generate-preview:predictLongRunning",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },

                body: JSON.stringify({
                    instances: [
                        {
                            prompt: prompt
                        }
                    ],

                    parameters: {
                        aspectRatio: "9:16",
                        durationSeconds: 8,
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            return res.status(response.status).json({
                error: data?.error?.message || "Veo API hatası.",
                details: data
            });

        }

        return res.status(200).json({

            success: true,

            operation: data.name,

            message:
                "Video üretimi başlatıldı."

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: error.message || "Sunucu hatası."
        });

    }
}
