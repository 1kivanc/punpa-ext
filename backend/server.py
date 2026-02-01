from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import base64
import numpy as np
from PIL import Image
import io
import cv2
import logging
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

logging.getLogger("ppocr").setLevel(logging.ERROR)

os.environ["FLAGS_allocator_strategy"] = 'naive_best_fit'
os.environ["FLAGS_fraction_of_gpu_memory_to_use"] = "0.8" 
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_enable_pir_in_executor"] = "0"
os.environ["FLAGS_use_mkldnn"] = "0"

app = Flask(__name__)
CORS(app)

# Env Vars
PORT = int(os.getenv('PORT', 5000))
HOST = os.getenv('HOST', '127.0.0.1')
DEBUG = os.getenv('FLASK_ENV') == 'development'

print("Initializing PaddleOCR with GPU... (Models will be downloaded on first run)")
ocr_engine = PaddleOCR(
    use_angle_cls=False, 
    lang='tr'
) 
print("PaddleOCR Initialized!")

@app.route('/ocr', methods=['POST'])
def ocr():
    try:
        data = request.json
        image_data = data.get('image')

        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        if ',' in image_data:
            image_data = image_data.split(',')[1]

        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert('RGB')
        image_np = np.array(image)
        image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

        result = ocr_engine.ocr(image_np)
        
        full_text_lines = []
        if result and result[0]:
            for line in result[0]:
                text = line[1][0]
                full_text_lines.append(text)
        


        full_text = "\n".join(full_text_lines)
        
        print(f"Paddle(GPU) Success! Len: {len(full_text)}")
        return jsonify({'text': full_text})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/config', methods=['GET'])
def get_config():
    return jsonify({
        'OCR_SERVER_URL': os.getenv('OCR_SERVER_URL', f'http://{HOST}:{PORT}'),
        'OLLAMA_API_URL': os.getenv('OLLAMA_API_URL', 'http://localhost:11434/v1/chat/completions')
    })

if __name__ == '__main__':
    app.run(host=HOST, port=PORT, debug=DEBUG)
