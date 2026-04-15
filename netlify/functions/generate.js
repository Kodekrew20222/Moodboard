exports.handler = async (event) => {
    console.log("🚀 Function started");

    // ✅ METHOD CHECK
    if (event.httpMethod !== "POST") {
        return response(405, { error: "Method not allowed" });
    }

    // ✅ SAFE BODY PARSE
    let body;
    try {
        body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
        console.error("❌ Body parse error:", event.body);
        return response(400, { error: "Invalid JSON body" });
    }

    console.log("📩 Parsed Body:", body);

    const script = body.script;
    const count = body.count || 6;

    if (!script) {
        return response(400, { error: "Script required" });
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const UNSPLASH_KEY = process.env.UNSPLASH_API_KEY;

    try {
        // ================= GEMINI =================
        const prompt = `
Act as a storyboard artist.

Extract exactly ${count} visual search queries.

Rules:
- Only concrete visual nouns
- 2-4 words per query
- No abstract concepts
- STRICT JSON ONLY

Script: "${script}"

Return:
{"frames":[{"query":"text"}]}
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
        console.log("🤖 Gemini:", JSON.stringify(geminiData));

        let text = "";

        if (geminiData.candidates?.length) {
            const parts = geminiData.candidates[0].content.parts;
            parts.forEach(p => {
                if (p.text) text += p.text;
            });
        }

        if (!text) {
            throw new Error("Empty Gemini response");
        }

        text = text.replace(/```json|```/g, '').trim();

        let frames;
        try {
            frames = JSON.parse(text).frames;
        } catch {
            console.log("⚠️ Fallback parsing");
            frames = text.split("\n").map(q => ({ query: q }));
        }

        console.log("🧠 Frames:", frames);

        // ================= UNSPLASH =================
        const images = [];

        for (let f of frames) {
            const res = await fetch(
                `https://api.unsplash.com/photos/random?query=${encodeURIComponent(f.query)}&client_id=${UNSPLASH_KEY}`
            );

            const data = await res.json();

            if (data.urls) {
                images.push({
                    url: data.urls.regular
                });
            }
        }

        console.log("✅ Images:", images.length);

        return response(200, { images });

    } catch (err) {
        console.error("🔥 ERROR:", err);
        return response(500, { error: err.message });
    }
};

// ✅ HELPER RESPONSE
function response(status, data) {
    return {
        statusCode: status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    };
}