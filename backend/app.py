from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import boto3
from datetime import datetime, timezone
from werkzeug.utils import secure_filename
import uuid
from models import db, Story

app = Flask(__name__)
CORS(app)

# Database setup
db_path = os.path.join(os.path.dirname(__file__), "stories.db")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    "postgresql://voice_your_story_db_user:prdbi1TCpi39KCc8eZY9mOeSqasStyhn@dpg-d3k02d6mcj7s73fmdo70-a/voice_your_story_db"
)

# Fix for older-style URLs (Render sometimes uses "postgres://")
if app.config["SQLALCHEMY_DATABASE_URI"].startswith("postgres://"):
    app.config["SQLALCHEMY_DATABASE_URI"] = app.config["SQLALCHEMY_DATABASE_URI"].replace("postgres://", "postgresql://")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# Environment vars
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "supersecret")
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:5000")

# S3 setup
S3_BUCKET = os.getenv("AWS_S3_BUCKET_NAME")
S3_REGION = os.getenv("AWS_S3_REGION")
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_S3_REGION", "us-west-2")
)


@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file part'}), 400

    audio = request.files['audio']
    if audio.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Give it a unique name
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = secure_filename(f"recording_{timestamp}.webm")

    # Upload to S3
    s3_key = f"uploads/{filename}"
    try:
        s3.upload_fileobj(
            audio,
            S3_BUCKET,
            s3_key,
            ExtraArgs={'ContentType': 'audio/webm', 'ACL': 'public-read'}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

    # Generate the S3 URL
    file_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s3_key}"

    # Save to database
    story = Story(filename=s3_key, created_at=datetime.now(timezone.utc))
    db.session.add(story)
    db.session.commit()

    return jsonify({
        'id': story.id,
        'filename': story.filename,
        'url': file_url,
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
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            iso = ts.astimezone(timezone.utc).isoformat()

        normalized.append({
            'id': s.id,
            'filename': s.filename,
            'url': f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s.filename}",
            'timestamp': iso,
            'likes': s.likes,
        })

    return jsonify(normalized)


@app.route('/stories/<int:story_id>', methods=["DELETE"])
def delete_story(story_id):
    data = request.get_json() or {}
    token = data.get("delete_token")

    story = Story.query.get(story_id)
    if not story:
        return jsonify({'error': 'Story not found'}), 404

    if token == story.delete_token or token == ADMIN_SECRET:
        try:
            s3.delete_object(Bucket=S3_BUCKET, Key=story.filename)
        except Exception as e:
            print(f"⚠️ Failed to delete from S3: {e}")
        

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

@app.route("/check_db")
def check_db():
    from models import Story
    try:
        count = Story.query.count()
        return jsonify({"db_connected": True, "story_count": count})
    except Exception as e:
        return jsonify({"db_connected": False, "error": str(e)})




if __name__ == '__main__':
    app.run(debug=True)

