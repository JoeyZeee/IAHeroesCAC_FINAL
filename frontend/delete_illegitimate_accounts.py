import firebase_admin
from firebase_admin import credentials, auth, firestore
from collections import defaultdict

# Path to your service account key JSON (same as used by your existing cleanup scripts)
SERVICE_ACCOUNT_PATH = r'C:\Users\jzamb\IAHeroesCAC_FINAL\IAHeroesCAC_FINAL\frontend\iaheroesv2-firebase-adminsdk-fbsvc-afa7db3fdb.json'

# 1) Specify the email addresses to keep (all others in Auth will be deleted)
keep_emails = [
    'jzambreno@gmail.com',
    'tzambreno@gmail.com',
    'zambreno@gmail.com',
    'pzambreno@gmail.com'
]

# 2) Optionally specify Firestore collections to prune for deleted users.
#    e.g. users, profiles, etc. Empty list leaves user records only in Auth.
collections_to_clean = ['users', 'profiles']

# 3) Additional safe emails (if you want to add more later)
extra_safe_emails = []


def initialize_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)


def delete_user_by_uid(uid, email=None):
    try:
        auth.delete_user(uid)
        print(f"[DELETED] Auth user: {email or uid} (uid={uid})")
        if collections_to_clean:
            delete_associated_firestore_data(uid, email=email)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to delete auth user {email or uid}: {e}")
        return False


def delete_associated_firestore_data(uid, email=None):
    db = firestore.client()

    # First, make sure we clean the users collection for the removed account.
    # This handles common schema patterns where user doc ID is uid, or email field is present, or userId field is present.
    user_collection = db.collection('users')
    deleted_users = 0
    try:
        # Delete by uid doc id (most direct)
        user_doc = user_collection.document(uid).get()
        if user_doc.exists:
            user_doc.reference.delete()
            deleted_users += 1
            print(f"    [PRUNED] users doc with id {uid}")
    except Exception as e:
        print(f"    [ERROR] Could not remove users doc by id={uid}: {e}")

    try:
        # Delete by explicit uid field
        if uid:
            docs = user_collection.where('userId', '==', uid).stream()
            uid_deleted = 0
            for doc in docs:
                doc.reference.delete()
                uid_deleted += 1
            if uid_deleted > 0:
                deleted_users += uid_deleted
                print(f"    [PRUNED] {uid_deleted} users docs with userId={uid}")
    except Exception as e:
        print(f"    [ERROR] Failed to prune users docs by userId={uid}: {e}")

    # Optionally delete by email field if provided
    if email:
        try:
            docs = user_collection.where('email', '==', email).stream()
            email_deleted = 0
            for doc in docs:
                doc.reference.delete()
                email_deleted += 1
            if email_deleted:
                deleted_users += email_deleted
                print(f"    [PRUNED] {email_deleted} users docs with email={email}")
        except Exception as e:
            print(f"    [ERROR] Failed to prune users docs by email={email}: {e}")

    # Continue cleaning other collections from settings.
    for coll in collections_to_clean:
        if coll == 'users':
            continue
        try:
            docs = db.collection(coll).where('userId', '==', uid).stream()
            deleted = 0
            for doc in docs:
                doc.reference.delete()
                deleted += 1
            if deleted:
                print(f"    [PRUNED] {deleted} docs in '{coll}' for uid={uid}")
        except Exception as e:
            print(f"    [ERROR] Failed to prune collection '{coll}' for uid={uid}: {e}")


def cleanup_users_collection(safe_uids):
    db = firestore.client()
    safe_emails = {e.lower() for e in keep_emails + extra_safe_emails}

    print("\n[INFO] Cleaning Firestore users collection for unsafe accounts and deduping safe emails...")
    users_ref = db.collection('users')

    safe_email_docs = []

    for doc in users_ref.stream():
        data = doc.to_dict() or {}
        doc_email = (data.get('email') or '').strip().lower()
        doc_uid = str(data.get('userId') or doc.id or '').strip()

        is_safe = doc_email in safe_emails or doc_uid in safe_uids or doc.id in safe_uids

        if not is_safe:
            print(f"    [DELETE UNSAFE USERDOC] {doc.id} email={doc_email} userId={doc_uid}")
            try:
                doc.reference.delete()
            except Exception as e:
                print(f"    [ERROR] Could not delete users doc {doc.id}: {e}")
            continue

        if doc_email in safe_emails:
            safe_email_docs.append((doc, doc_email, doc_uid))

    # Deduplicate safe email docs (keep exactly one per safe email)
    grouped_by_email = {}
    for doc, doc_email, doc_uid in safe_email_docs:
        grouped_by_email.setdefault(doc_email, []).append((doc, doc_uid))

    for email, docs in grouped_by_email.items():
        if len(docs) <= 1:
            continue

        keeper = None
        for doc, doc_uid in docs:
            if doc_uid in safe_uids or doc.id in safe_uids:
                keeper = doc
                break

        if keeper is None:
            keeper = docs[0][0]

        for doc, _doc_uid in docs:
            if doc.id == keeper.id:
                continue
            print(f"    [DELETE DUPLICATE SAFE USERDOC] {doc.id} email={email} userId={_doc_uid}")
            try:
                doc.reference.delete()
            except Exception as e:
                print(f"    [ERROR] Could not delete duplicate users doc {doc.id}: {e}")


def run():
    initialize_firebase()

    # Collect all users and group by email
    users_by_email = defaultdict(list)
    for user in auth.list_users().iterate_all():
        users_by_email[user.email].append(user)

    # Determine which UIDs to keep
    kept_uids = set()
    for email, users in users_by_email.items():
        if email not in keep_emails:
            continue  # will delete all
        if len(users) == 1:
            kept_uids.add(users[0].uid)
        else:
            # multiple, decide which to keep
            if email == 'jzambreno@gmail.com':
                # prefer google provider
                google_user = None
                for u in users:
                    if any(p.provider_id == 'google.com' for p in u.provider_data):
                        google_user = u
                        break
                if google_user:
                    kept_uids.add(google_user.uid)
                else:
                    kept_uids.add(users[0].uid)  # arbitrary if no google
            else:
                kept_uids.add(users[0].uid)  # arbitrary for other keep emails

    # Delete users not in kept_uids
    for user in auth.list_users().iterate_all():
        if user.uid in kept_uids:
            print(f"[KEEP] {user.email} (uid={user.uid})")
        else:
            print(f"[WILL DELETE] {user.email} (uid={user.uid})")
            delete_user_by_uid(user.uid, user.email)

    # Ensure Users collection is also in whitelist state for management panel
    cleanup_users_collection(kept_uids)

    print('\n*** Completed illegitimate account removal pass. ***')


if __name__ == '__main__':
    run()
