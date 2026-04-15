// ================= CONFIG =================
const API_URL = '/.netlify/functions/generate';

// ================= DOM =================
const scriptInput = document.getElementById('scriptInput');
const imageCountInput = document.getElementById('imageCount');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const moodboard = document.getElementById('moodboard');
const messageDiv = document.getElementById('message');

generateBtn.addEventListener('click', generateMoodboard);

// Clear button (keeps your UI same)
clearBtn.addEventListener('click', () => {
    scriptInput.value = '';
    moodboard.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">✨</div>
            <p>Your moodboard will appear here</p>
        </div>
    `;
    messageDiv.innerHTML = '';
});

// ================= MAIN =================
async function generateMoodboard() {
    const script = scriptInput.value.trim();
    const count = parseInt(imageCountInput.value) || 6;

    if (!script) return showError('Please enter a script');

    console.log("📤 Sending:", { script, count });

    generateBtn.disabled = true;
    showLoading();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script, count })
        });

        console.log("📥 Status:", res.status);

        // ✅ SAFE RESPONSE PARSE
        let data;
        try {
            const text = await res.text();
            console.log("📦 RAW RESPONSE:", text);
            data = JSON.parse(text);
        } catch (e) {
            throw new Error("Invalid JSON from server");
        }

        console.log("📦 Parsed:", data);

        if (!res.ok) {
            throw new Error(data.error || "Server error");
        }

        displayMoodboard(data.images);
        showSuccess(`Generated ${data.images.length} frames ✨`);

    } catch (err) {
        console.error("❌ Frontend Error:", err);
        showError(err.message);
    } finally {
        generateBtn.disabled = false;
    }
}

// ================= UI =================
function displayMoodboard(images) {
    moodboard.innerHTML = '';

    if (!images || images.length === 0) {
        return showError("No images found.");
    }

    images.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'moodboard-item';
        div.innerHTML = `
            <img src="${img.url}" alt="${img.alt}" loading="lazy">
            <div class="overlay">
                <span>Frame ${index + 1}: ${img.description}</span>
            </div>
        `;
        moodboard.appendChild(div);
    });
}

function showLoading() {
    moodboard.innerHTML = `<div class="loading">Analyzing script and fetching frames...</div>`;
    messageDiv.innerHTML = '';
}

function showError(msg) {
    messageDiv.innerHTML = `<div class="error">❌ ${msg}</div>`;
}

function showSuccess(msg) {
    messageDiv.innerHTML = `<div class="success">✅ ${msg}</div>`;
}