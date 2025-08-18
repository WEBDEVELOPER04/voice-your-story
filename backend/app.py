from flask import Flask, request, jsonify
from flask import send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file part'}), 400

    audio = request.files['audio']
    if audio.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"recording_{timestamp}.webm"
    filepath = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
    audio.save(filepath)

    print(f"Saved file to: {filepath}")
    return jsonify({'message': 'File uploaded successfully'})


@app.route('/stories', methods=['GET'])
def list_stories():
    stories = []
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            stories.append({
                'filename': filename,
                'url': f"http://127.0.0.1:5000/uploads/{filename}",
                'timestamp': os.path.getmtime(file_path)
            })
    stories.sort(key=lambda x: x['timestamp'], reverse = True)
    return jsonify(stories)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)