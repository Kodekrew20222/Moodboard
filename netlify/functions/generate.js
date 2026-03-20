exports.handler = async (event) => {
    try {
        const { script, count } = JSON.parse(event.body);

        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        const UNSPLASH_KEY = process.env.UNSPLASH_API_KEY;

        if (!script) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Script required" })
            };
        }

        // ================= GEMINI =================
        const prompt = `
        Act as a storyboard artist. Analyze this script and identify exactly ${count} key visual moments.
        For each moment, create a 3-4 word "Search Query".

        Rules:
        - ONLY concrete nouns
        - NO abstract words
        - Output EXACTLY ${count} items

        Script: "${script}"

        Return JSON:
        {
          "frames": [{ "query": "text" }]
        }
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

        const geminiData = await geminiRes.json();

        let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const frames = JSON.parse(text).frames;

        // ================= UNSPLASH =================
        const images = [];

        for (let i = 0; i < frames.length; i++) {
            const q = frames[i].query;

            try {
                const res = await fetch(
                    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=landscape&client_id=${UNSPLASH_KEY}`
                );

                const data = await res.json();

                if (data.urls) {
                    images.push({
                        url: data.urls.regular,
                        alt: q,
                        description: q
                    });
                }
            } catch (e) {}

            await new Promise(r => setTimeout(r, 200));
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ images })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};