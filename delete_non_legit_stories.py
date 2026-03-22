import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app with service account key
cred = credentials.Certificate('')
firebase_admin.initialize_app(cred)
db = firestore.client()

# List of legit stories to keep
keep_names = [
    'Linda Lee',
    'Carlos Martinez',
    'James Brown',
    'Mary Johnson',
    'John Smith',
]

# Delete all stories except those in keep_names
stories = db.collection('stories').stream()
for s in stories:
    d = s.to_dict()
    if d.get('veteranName') not in keep_names:
        db.collection('stories').document(s.id).delete()
        print('Deleted', d.get('veteranName'))
    else:
        print('Kept', d.get('veteranName')) 
