// ================= CONFIG =================
const API_URL = '/.netlify/functions/generate';

// ================= DOM =================
const scriptInput = document.getElementById('scriptInput');
const imageCountInput = document.getElementById('imageCount');
const generateBtn = document.getElementById('generateBtn');
const moodboard = document.getElementById('moodboard');
const messageDiv = document.getElementById('message');

generateBtn.addEventListener('click', generateMoodboard);

// ================= MAIN =================
async function generateMoodboard() {
    const script = scriptInput.value.trim();
    const count = parseInt(imageCountInput.value) || 6;

    if (!script) return showError('Please enter a script');

    generateBtn.disabled = true;
    showLoading();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script, count })
        });

        if (!res.ok) throw new Error("Server error");

        const data = await res.json();

        displayMoodboard(data.images);
        showSuccess(`Generated ${data.images.length} frames ✨`);

    } catch (err) {
        console.error(err);
        showError(err.message);
    } finally {
        generateBtn.disabled = false;
    }
}

// ================= UI =================
function displayMoodboard(images) {
    moodboard.innerHTML = '';
    if (!images || images.length === 0) return showError("No images found.");

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