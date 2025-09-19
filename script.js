// --- Ambil Elemen DOM ---
const uploadBox = document.getElementById('upload-box');
const imageUploadInput = document.getElementById('image-upload-input');
const imagePreview = document.getElementById('image-preview');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const predictBtn = document.getElementById('predict-btn');
const resultBox = document.getElementById('result-box');

// --- Variabel Global untuk Model ---
let model;

// --- Fungsi untuk Memuat Model TF.js ---
async function loadModel() {
    try {
        const modelURL = './model/model.json'; 
        model = await tf.loadLayersModel(modelURL);
        console.log("Model loaded successfully!");
        
        predictBtn.disabled = false;
        predictBtn.textContent = 'Predict';
    } catch (error) {
        console.error("Error loading model: ", error);
        resultBox.textContent = 'Failed to load model.';
        resultBox.style.display = 'block'; // Tampilkan jika ada error
    }
}

// Inisialisasi
predictBtn.disabled = true;
predictBtn.textContent = 'Loading Model...';
loadModel();


// --- Event Listener untuk Upload Gambar ---
uploadBox.addEventListener('click', () => imageUploadInput.click());

imageUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            // PERBAIKAN: Sembunyikan result box saat gambar baru di-upload
            resultBox.style.display = 'none'; 
            resultBox.textContent = ''; // Kosongkan isinya
        };
        reader.readAsDataURL(file);
    }
});


// --- Event Listener untuk Tombol Predict ---
predictBtn.addEventListener('click', async () => {
    if (!model || !imagePreview.src || imagePreview.src.endsWith('#')) {
        resultBox.textContent = 'Please upload an image first.';
        // PERBAIKAN: Tampilkan result box jika ada pesan error
        resultBox.style.display = 'block'; 
        return;
    }
    
    // PERBAIKAN: Tampilkan result box saat proses analisa dimulai
    resultBox.style.display = 'block'; 
    resultBox.textContent = 'Analyzing...';

    try {
        const tensor = tf.browser.fromPixels(imagePreview)
            .resizeNearestNeighbor([224, 224]) 
            .toFloat()
            .div(tf.scalar(255.0))
            .expandDims();

        const predictions = await model.predict(tensor).data();
        
        const classNames = ['Fresh', 'Rotten', 'Medium']; 
        
        const predictedIndex = predictions.indexOf(Math.max(...predictions));
        const result = classNames[predictedIndex];
        const confidence = (Math.max(...predictions) * 100).toFixed(2);
        
        resultBox.textContent = `Result: ${result} (${confidence}%)`;

        tensor.dispose();

    } catch (error) {
        console.error("Error during prediction: ", error);
        resultBox.textContent = 'Error predicting the image.';
    }
});