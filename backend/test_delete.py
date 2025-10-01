import requests

BASE_URL = "http://127.0.0.1:5000"

# Upload a story
with open("test_audio.webm", "rb") as f:
    res = requests.post(f"{BASE_URL}/upload", files={"audio": f})
    story = res.json()
    print("Uploaded story:", story)

story_id = story["id"]

# Try deleting with the wrong token
wrong_token = "not_the_right_one"
res = requests.delete(
    f"{BASE_URL}/stories/{story_id}", 
    json={"delete_token": wrong_token}
)
print("Wrong token response:", res.json())

# Try deleting with the ADMIN_SECRET
admin_token = "supersecret"   # <-- or the one you set in ENV
res = requests.delete(
    f"{BASE_URL}/stories/{story_id}", 
    json={"delete_token": admin_token}
)
print("Admin delete response:", res.json())

