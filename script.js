/**
 * Freshness Checker Script
 * Handles model loading, image preview, and prediction logic for the fruit/vegetable freshness checker app.
 */

// --- KONSTANTA & ELEMEN DOM ---

const CLASS_NAMES = [
    'fresh_apple', 'fresh_banana', 'fresh_bitter_gourd',
    'fresh_capsicum', 'fresh_orange', 'fresh_tomato',
    'stale_apple', 'stale_banana', 'stale_bitter_gourd',
    'stale_capsicum', 'stale_orange', 'stale_tomato'
];

const UI = {
    uploadBox: document.getElementById('upload-box'),
    imageUploadInput: document.getElementById('image-upload-input'),
    imagePreview: document.getElementById('image-preview'),
    uploadPlaceholder: document.getElementById('upload-placeholder'),
    predictBtn: document.getElementById('predict-btn'),
    resultBox: document.getElementById('result-box')
};

let model;

// --- FUNGSI-FUNGSI UTAMA ---

/**
 * Memuat model TensorFlow.js dan memperbarui UI.
 */
async function loadModel() {
    try {
        const modelURL = './model_fixed/model.json';
        model = await tf.loadLayersModel(modelURL);
        console.log("Model loaded successfully!");
        UI.predictBtn.disabled = false;
        UI.predictBtn.textContent = 'Predict';
    } catch (error) {
        console.error("Error loading model: ", error);
        UI.resultBox.textContent = 'Failed to load model.';
        UI.resultBox.style.display = 'block';
    }
}

/**
 * Menampilkan pratinjau gambar yang dipilih oleh pengguna.
 * @param {File} file - File gambar yang di-upload.
 */
function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        UI.imagePreview.src = e.target.result;
        UI.imagePreview.style.display = 'block';
        UI.uploadPlaceholder.style.display = 'none';
        UI.resultBox.style.display = 'none';
        UI.resultBox.textContent = '';
    };
    reader.readAsDataURL(file);
}

/**
 * Memformat nama kelas dari 'snake_case' menjadi 'Title Case'.
 * @param {string} className - Nama kelas dari model.
 * @returns {string} Nama kelas yang sudah diformat.
 */
const formatClassName = (className) =>
    className
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

/**
 * Menjalankan proses prediksi pada gambar.
 */
async function handlePrediction() {
    if (!model || !UI.imagePreview.src || UI.imagePreview.src.endsWith('#')) {
        UI.resultBox.textContent = 'Please upload an image first.';
        UI.resultBox.style.display = 'block';
        return;
    }

    let tensor;
    try {
        UI.predictBtn.disabled = true;
        UI.resultBox.style.display = 'block';
        UI.resultBox.textContent = 'Analyzing...';

        tensor = tf.tidy(() => {
            const imgTensor = tf.browser.fromPixels(UI.imagePreview)
                .resizeNearestNeighbor([224, 224])
                .toFloat();
            
            // Menggunakan preprocessing untuk model VGG/ResNet
            const meanPixel = tf.tensor1d([103.939, 116.779, 123.68]);
            return imgTensor.reverse(-1).sub(meanPixel).expandDims();
        });

        const predictions = await model.predict(tensor).data();
        const maxPrediction = Math.max(...predictions);
        const predictedIndex = predictions.indexOf(maxPrediction);
        
        const resultRaw = CLASS_NAMES[predictedIndex];
        const confidence = (maxPrediction * 100).toFixed(2);
        const resultFormatted = formatClassName(resultRaw);
        
        UI.resultBox.textContent = `Result: ${resultFormatted} (${confidence}%)`;

    } catch (error) {
        console.error("Error during prediction: ", error);
        UI.resultBox.textContent = 'Error predicting the image.';
    } finally {
        if (tensor) {
            tensor.dispose();
        }
        UI.predictBtn.disabled = false;
    }
}

// --- INISIALISASI & EVENT LISTENERS ---

/**
 * Menginisialisasi aplikasi dengan mengatur listener dan memuat model.
 */
function initializeApp() {
    UI.predictBtn.disabled = true;
    UI.predictBtn.textContent = 'Loading Model...';
    
    UI.uploadBox.addEventListener('click', () => UI.imageUploadInput.click());

    // --- TAMBAHKAN KODE INI ---
    // Me-reset nilai input setiap kali diklik.
    // Ini memastikan event 'change' akan selalu terpicu, bahkan untuk file yang sama.
    UI.imageUploadInput.addEventListener('click', (event) => {
        event.target.value = null;
    });
    // --- AKHIR DARI KODE TAMBAHAN ---

    UI.imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            displayImagePreview(file);
        }
    });

    UI.predictBtn.addEventListener('click', handlePrediction);

    loadModel();
}

// Jalankan aplikasi
initializeApp();