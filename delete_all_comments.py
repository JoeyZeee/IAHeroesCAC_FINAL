import firebase_admin
from firebase_admin import credentials, firestore

# Path to your service account key JSON
SERVICE_ACCOUNT_PATH = ''

    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)


def delete_all_comments():
    db = firestore.client()

    stories_ref = db.collection('stories')
    stories = list(stories_ref.stream())

    print(f"[INFO] Found {len(stories)} stories. Deleting all comments...\n")

    total_deleted = 0

    for story_doc in stories:
        story_id = story_doc.id
        story_data = story_doc.to_dict() or {}
        veteran_name = story_data.get('veteranName', 'Unknown Veteran')

        comments_ref = db.collection('stories').document(story_id).collection('comments')
        comments = list(comments_ref.stream())

        if not comments:
            print(f"[SKIP] '{veteran_name}' (id={story_id}) — no comments")
            continue

        print(f"[STORY] '{veteran_name}' (id={story_id}) — deleting {len(comments)} comment(s)...")

        for comment_doc in comments:
            try:
                comment_doc.reference.delete()
                total_deleted += 1
                print(f"    [DELETED] comment id={comment_doc.id}")
            except Exception as e:
                print(f"    [ERROR] Could not delete comment id={comment_doc.id}: {e}")

    print(f"\n*** Done. Deleted {total_deleted} comment(s) across {len(stories)} stories. ***")


def run():
    initialize_firebase()
    delete_all_comments()


if __name__ == '__main__':
    run()
