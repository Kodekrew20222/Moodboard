exports.handler = async (event) => {
    console.log("🚀 Function started");

    try {
        const { script, count } = JSON.parse(event.body);
        console.log("📩 Input:", script, count);

        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        const UNSPLASH_KEY = process.env.UNSPLASH_API_KEY;

        if (!GEMINI_KEY || !UNSPLASH_KEY) {
            throw new Error("Missing API keys");
        }

        // ================= GEMINI =================
        const prompt = `
        Act as a storyboard artist.
        Extract exactly ${count} visual search queries.

        Rules:
        - Only concrete nouns
        - 3-4 words max
        - No abstract terms

        Script: "${script}"

        Return JSON:
        { "frames": [{ "query": "text" }] }
        `;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        console.log("🤖 Gemini status:", geminiRes.status);

        const geminiData = await geminiRes.json();
        console.log("🤖 Gemini raw:", JSON.stringify(geminiData));

        let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("Empty Gemini response");

        let frames = [];

        try {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            frames = JSON.parse(text).frames;
        } catch (e) {
            console.error("❌ JSON Parse Error:", text);
            throw new Error("Failed to parse Gemini output");
        }

        console.log("🧠 Frames:", frames);

        // ================= UNSPLASH =================
        const images = [];

        for (let i = 0; i < frames.length; i++) {
            const q = frames[i].query;

            try {
                const res = await fetch(
                    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=landscape&client_id=${UNSPLASH_KEY}`
                );

                console.log(`📸 Unsplash (${q}):`, res.status);

                const data = await res.json();

                if (data && data.urls) {
                    images.push({
                        url: data.urls.regular,
                        alt: q,
                        description: q
                    });
                }

            } catch (err) {
                console.error("❌ Unsplash error:", err);
            }
        }

        console.log("✅ Images fetched:", images.length);

        return {
            statusCode: 200,
            body: JSON.stringify({ images })
        };

    } catch (err) {
        console.error("🔥 FUNCTION ERROR:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: err.message
            })
        };
    }
};