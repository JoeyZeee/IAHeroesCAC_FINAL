import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app (assumes GOOGLE_APPLICATION_CREDENTIALS is set)
cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

# Get all existing story IDs
stories = db.collection('stories').stream()
existing_story_ids = set(s.id for s in stories)

# Delete bookmarks for non-existent stories
bookmarks = db.collection('bookmarks').stream()
for b in bookmarks:
    d = b.to_dict()
    story_id = d.get('storyId')
    if story_id not in existing_story_ids:
        db.collection('bookmarks').document(b.id).delete()
        print('Deleted orphaned bookmark:', b.id, 'for storyId:', story_id)
    else:
        print('Kept bookmark:', b.id, 'for storyId:', story_id) 