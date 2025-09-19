// fix_model.js (Final Version)

const fs = require('fs');
const path = require('path');

const sourceModelPath = path.join(__dirname, 'model', 'model.json');
const destDir = path.join(__dirname, 'model_fixed');
const destModelPath = path.join(destDir, 'model.json');

console.log('Membaca model dari:', sourceModelPath);

try {
    const modelJsonString = fs.readFileSync(sourceModelPath, 'utf8');
    const modelConfig = JSON.parse(modelJsonString);

    console.log('Model berhasil dibaca. Memulai proses perbaikan...');

    modelConfig.modelTopology.model_config.config.layers.forEach(layer => {
        if (layer.inbound_nodes && layer.inbound_nodes.length > 0) {
            
            if (typeof layer.inbound_nodes[0] === 'object' && layer.inbound_nodes[0] !== null && layer.inbound_nodes[0].args) {
                
                const newInboundNodes = [];
                const node = layer.inbound_nodes[0]; // Keras 3 format usually wraps nodes this way
                
                // PERBAIKAN DI SINI:
                // Cek apakah argumen adalah array (untuk multi-input layer seperti 'Add')
                // atau hanya objek (untuk single-input layer)
                const inputs = Array.isArray(node.args[0]) ? node.args[0] : [node.args[0]];

                inputs.forEach(inputTensor => {
                    const history = inputTensor.config.keras_history;
                    if (history) {
                        newInboundNodes.push([history[0], history[1], history[2], {}]);
                    }
                });
                
                layer.inbound_nodes = [newInboundNodes];
            }
        }
    });

    console.log('Perbaikan format inbound_nodes selesai.');

    if (!fs.existsSync(destDir)){
        fs.mkdirSync(destDir);
    }

    fs.writeFileSync(destModelPath, JSON.stringify(modelConfig, null, 2));

    console.log('✅ Sukses! Model yang telah diperbaiki disimpan di:', destModelPath);
    console.log('--> Jangan lupa salin file .bin ke folder model_fixed dan ubah path di script.js Anda!');

} catch (error) {
    console.error('❌ Terjadi error:', error);
}