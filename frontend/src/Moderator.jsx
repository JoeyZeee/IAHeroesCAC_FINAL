import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./components/AuthContext";

const MODERATOR_UID = "VFNN3G45mcaMAFFDmT3IwsZmWgp2";

export default function Moderator() {
  const { user, userRole, loading } = useAuth();
  const [tab, setTab] = useState("flaggedStories");
  const [pendingStories, setPendingStories] = useState([]);
  const [flaggedStories, setFlaggedStories] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    setDataLoading(true);
    const storiesSnap = await getDocs(query(collection(db, "stories"), where("status", "==", "PENDING")));
    setPendingStories(storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const flaggedStoriesSnap = await getDocs(query(collection(db, "stories"), where("flagged", "==", true)));
    setFlaggedStories(flaggedStoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    let allFlaggedComments = [];
    const allStoriesSnap = await getDocs(collection(db, "stories"));
    for (const storyDoc of allStoriesSnap.docs) {
      const commentsSnap = await getDocs(query(collection(db, "stories", storyDoc.id, "comments"), where("flagged", "==", true)));
      allFlaggedComments.push(...commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), storyId: storyDoc.id })));
    }
    setFlaggedComments(allFlaggedComments);

    const usersSnap = await getDocs(collection(db, "users"));
    setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setDataLoading(false);
  };

  const approveStory = async (id) => {
    await updateDoc(doc(db, "stories", id), { flagged: false });
    fetchAll();
  };
  const rejectStory = async (id) => {
    await updateDoc(doc(db, "stories", id), { status: "REJECTED" });
    fetchAll();
  };
  const deleteStory = async (id) => {
    await deleteDoc(doc(db, "stories", id));
    fetchAll();
  };

  // Cascade delete: remove all replies to a comment, then the comment itself
  const deleteComment = async (commentId, storyId) => {
    const allCommentsSnap = await getDocs(collection(db, "stories", storyId, "comments"));
    const childIds = allCommentsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.parentId === commentId)
      .map(c => c.id);
    await Promise.all(childIds.map(childId =>
      deleteDoc(doc(db, "stories", storyId, "comments", childId))
    ));
    await deleteDoc(doc(db, "stories", storyId, "comments", commentId));
    fetchAll();
  };

  const unflagComment = async (id, storyId) => {
    await updateDoc(doc(db, "stories", storyId, "comments", id), { flagged: false });
    fetchAll();
  };
  const banUser = async (id) => {
    await updateDoc(doc(db, "users", id), { banned: true });
    fetchAll();
  };
  const unbanUser = async (id) => {
    await updateDoc(doc(db, "users", id), { banned: false });
    fetchAll();
  };
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
    alert(`Password reset email sent to ${email}`);
  };
  const unflagStory = async (id) => {
    await updateDoc(doc(db, "stories", id), { flagged: false });
    fetchAll();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-us-blue text-us-white">Loading...</div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-us-white text-us-red">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <svg className="w-16 h-16 text-us-red" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p>You are logged out.</p>
      </div>
    </div>
  );
  if (user.uid !== MODERATOR_UID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-us-white text-us-red">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16 text-us-red" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You are not authorized to access this page.</p>
        </div>
      </div>
    );
  }
  if (user && users.find(u => u.id === user.uid && u.banned)) {
    return <div className="min-h-screen flex items-center justify-center bg-us-blue text-us-red text-2xl font-bold">You are banned from accessing this site.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-us-blue flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto py-10 px-4 bg-us-white rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-extrabold text-us-blue mb-8 text-center drop-shadow">Moderator Portal</h2>
        <div className="flex gap-4 mb-8 justify-center">
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow ${tab === "flaggedStories" ? "bg-us-red text-us-white" : "bg-us-white text-us-blue border border-us-blue"}`}
            onClick={() => setTab("flaggedStories")}
          >
            Flagged Stories
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow ${tab === "flaggedComments" ? "bg-us-red text-us-white" : "bg-us-white text-us-blue border border-us-blue"}`}
            onClick={() => setTab("flaggedComments")}
          >
            Flagged Comments
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow ${tab === "users" ? "bg-us-red text-us-white" : "bg-us-white text-us-blue border border-us-blue"}`}
            onClick={() => setTab("users")}
          >
            User Management
          </button>
        </div>

        {dataLoading ? <div className="text-us-blue text-center">Loading...</div> : (
          <>
            {tab === "flaggedStories" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-us-blue">Flagged Stories</h2>
                {flaggedStories.length === 0
                  ? <div className="text-us-blue">No flagged stories.</div>
                  : flaggedStories.map(story => (
                  <div key={story.id} className="border border-gray-300 rounded-xl p-4 mb-4 shadow" style={{backgroundColor: '#ffffff'}}>
                    <div className="font-bold mb-1" style={{color: '#000000'}}>{story.title || story.veteranName || "Untitled"}</div>
                    <div className="text-sm mb-3 line-clamp-3" style={{color: '#000000'}}>{story.story}</div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={`/archive/${story.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-us-blue underline text-sm"
                      >
                        View Story
                      </a>
                      <button
                        className="bg-us-blue text-us-white rounded px-3 py-1 text-xs font-semibold"
                        onClick={() => approveStory(story.id)}
                      >
                        Approve / Unflag
                      </button>
                      <button
                        className="bg-us-red text-us-white rounded px-3 py-1 text-xs font-semibold"
                        onClick={() => deleteStory(story.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "flaggedComments" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-us-blue">Flagged Comments</h2>
                {flaggedComments.length === 0
                  ? <div className="text-us-blue">No flagged comments.</div>
                  : flaggedComments.map(comment => (
                  <div key={comment.id} className="border border-gray-300 rounded-xl p-4 mb-4 shadow" style={{backgroundColor: '#ffffff', color: '#000000'}}>
                    <div className="text-sm mb-1" style={{color: '#000000'}}>
                      <span className="font-semibold" style={{color: '#000000'}}>{comment.userName || "Anonymous"}:</span> {comment.text}
                    </div>
                    <div className="text-xs mb-3" style={{color: '#555555'}}>Story ID: {comment.storyId}</div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={`/archive/${comment.storyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-us-blue underline text-sm"
                      >
                        View Story
                      </a>
                      <button
                        className="bg-us-blue text-us-white rounded px-3 py-1 text-xs font-semibold"
                        onClick={() => unflagComment(comment.id, comment.storyId)}
                      >
                        Unflag
                      </button>
                      <button
                        className="bg-us-red text-us-white rounded px-3 py-1 text-xs font-semibold"
                        onClick={() => deleteComment(comment.id, comment.storyId)}
                      >
                        Delete (+ replies)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "users" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-us-blue">User Management</h2>
                {users.length === 0
                  ? <div className="text-us-blue">No users found.</div>
                  : users.map(u => (
                  <div key={u.id} className="border border-gray-300 rounded-xl p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between shadow" style={{backgroundColor: '#ffffff'}}>
                    <div>
                      <div className="font-bold" style={{color: '#000000'}}>{u.email}</div>
                      <div className="text-sm" style={{color: '#000000'}}>Role: {u.role}</div>
                      {u.banned && <div className="text-us-red font-bold text-sm mt-1">BANNED</div>}
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      {!u.banned
                        ? <button className="bg-us-red text-us-white rounded px-3 py-1 text-xs font-semibold" onClick={() => banUser(u.id)}>Ban</button>
                        : <button className="border border-us-red text-us-white rounded px-3 py-1 text-xs font-semibold" onClick={() => unbanUser(u.id)}>Unban</button>
                      }
                      <button
                        className="bg-us-blue text-us-white rounded px-3 py-1 text-xs font-semibold"
                        onClick={() => resetPassword(u.email)}
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
