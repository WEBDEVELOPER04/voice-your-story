from app import app, db, Story, UPLOAD_FOLDER
import os

def cleanup():
    with app.app_context():
        stories = Story.query.all()
        for story in stories:
            filepath = os.path.join(UPLOAD_FOLDER, story.filename)
            if not os.path.exists(filepath):
                print(f"Deleting DB record for missing file: {story.filename}")
                db.session.delete(story)
        db.session.commit()
        print("Cleanup complete!")

if __name__ == "__main__":
    cleanup()

