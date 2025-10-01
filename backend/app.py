from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime, timezone
from werkzeug.utils import secure_filename
import uuid
from models import db, Story  # import SQLAlchemy db + Story model

app = Flask(__name__)
CORS(app)

# Configure SQLite database
db_path = os.path.join(os.path.dirname(__file__), "stories.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Bind SQLAlchemy to this Flask app
db.init_app(app)

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

    # Save to database
    story = Story(filename=filename, created_at=datetime.now(timezone.utc))
    db.session.add(story)
    db.session.commit()

    return jsonify({
        'id': story.id,
        'filename': story.filename,
        'created_at': story.created_at.isoformat(),
        'delete_token': story.delete_token
    })



@app.route('/stories', methods=['GET'])
def list_stories():
    stories = Story.query.order_by(Story.likes.desc(), Story.created_at.desc()).all()
    normalized = []

    for s in stories:
        ts = s.created_at

        if ts is None:
            iso = None
        else:
            # If datetime is naive (no tzinfo), assume it's UTC
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            iso = ts.astimezone(timezone.utc).isoformat()

        normalized.append({
            'id': s.id,
            'filename': s.filename,
            'url': f"http://127.0.0.1:5000/uploads/{s.filename}",
            'timestamp': iso,
            'likes': s.likes,
        })

    return jsonify(normalized)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "supersecret")

@app.route('/stories/<int:story_id>', methods=["DELETE"])
def delete_story(story_id):
    data = request.get_json() or {}
    token = data.get("delete_token")
    print("Received delete token:", token)

    story = Story.query.get(story_id)
    if not story:
        return jsonify({'error': 'Story not found'}), 404

    if token == story.delete_token or token == ADMIN_SECRET:
        filepath = os.path.join(UPLOAD_FOLDER, story.filename)
        if os.path.exists(filepath):
            os.remove(filepath)

        db.session.delete(story)
        db.session.commit()
        return jsonify({'message': 'Story deleted successfully'})

    return jsonify({'error': 'Unauthorized'}), 403

@app.route('/stories/<int:story_id>/like', methods=['POST'])
def like_story(story_id):
    story = Story.query.get(story_id)
    if not story:
        return jsonify({'error': 'Story not found'}), 404

    story.likes += 1
    db.session.commit()
    return jsonify({'id': story.id, 'likes': story.likes})



if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # ensures SQLite tables exist
    app.run(debug=True)
