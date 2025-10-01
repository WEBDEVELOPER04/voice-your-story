from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import uuid

db = SQLAlchemy()

class Story(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    delete_token = db.Column(db.String(255), default=lambda: str(uuid.uuid4()), nullable=False)
    likes = db.Column(db.Integer, default=0)