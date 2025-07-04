import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./components/AuthContext";

const MODERATOR_UID = "VFNN3G45mcaMAFFDmT3IwsZmWgp2"; // Actual moderator UID

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
    // Pending stories
    const storiesSnap = await getDocs(query(collection(db, "stories"), where("status", "==", "PENDING")));
    setPendingStories(storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    // Flagged stories
    const flaggedStoriesSnap = await getDocs(query(collection(db, "stories"), where("flagged", "==", true)));
    setFlaggedStories(flaggedStoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    // Flagged comments (search all stories)
    let allFlaggedComments = [];
    const allStoriesSnap = await getDocs(collection(db, "stories"));
    for (const storyDoc of allStoriesSnap.docs) {
      const commentsSnap = await getDocs(query(collection(db, "stories", storyDoc.id, "comments"), where("flagged", "==", true)));
      allFlaggedComments.push(...commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), storyId: storyDoc.id })));
    }
    setFlaggedComments(allFlaggedComments);
    // Users
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
  const deleteComment = async (id, storyId) => {
    await deleteDoc(doc(db, "stories", storyId, "comments", id));
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d5a27] to-[#4a7c59] text-white">Loading...</div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-red-200">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <svg className="w-16 h-16 text-red-300" fill="currentColor" viewBox="0 0 24 24">
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
      <div className="min-h-screen flex items-center justify-center bg-white text-red-200">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16 text-red-300" fill="currentColor" viewBox="0 0 24 24">
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
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d5a27] to-[#4a7c59] text-red-200 text-2xl font-bold">You are banned from accessing this site.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f6fcf6] to-[#eaf7ea] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto py-10 px-4 bg-white rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-extrabold text-[#2d5a27] mb-8 text-center drop-shadow">Moderator Portal</h2>
        <div className="flex gap-4 mb-8 justify-center">
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "flaggedStories" ? "bg-[#2d5a27] text-white scale-105" : "bg-white text-[#2d5a27] hover:bg-[#eaf7ea] border border-green-200"}`}
            onClick={() => setTab("flaggedStories")}
          >
            Flagged Stories
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "flaggedComments" ? "bg-[#2d5a27] text-white scale-105" : "bg-white text-[#2d5a27] hover:bg-[#eaf7ea] border border-green-200"}`}
            onClick={() => setTab("flaggedComments")}
          >
            Flagged Comments
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "users" ? "bg-[#2d5a27] text-white scale-105" : "bg-white text-[#2d5a27] hover:bg-[#eaf7ea] border border-green-200"}`}
            onClick={() => setTab("users")}
          >
            User Management
          </button>
        </div>
        {dataLoading ? <div>Loading...</div> : (
          <>
            {tab === "flaggedStories" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-[#2d5a27]">Flagged Stories</h2>
                {flaggedStories.length === 0 ? <div className="text-gray-700">No flagged stories.</div> : flaggedStories.map(story => (
                  <div key={story.id} className="border rounded-xl p-4 mb-4 bg-white text-[#2d5a27] shadow">
                    <div className="font-bold">{story.title || story.veteranName || "Untitled"}</div>
                    <div className="mb-2 text-gray-700">{story.story}</div>
                    <a href={`/archive/${story.id}`} target="_blank" rel="noopener noreferrer" className="text-[#4a7c59] underline mr-4">View Story</a>
                    <button className="mr-2 border border-[#4a7c59] text-[#4a7c59] rounded px-3 py-1 text-xs font-semibold transition-colors duration-150 hover:bg-[#5a8c69] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#4a7c59]" onClick={()=>approveStory(story.id)}>Approve/Unflag</button>
                    <button className="text-red-600" onClick={()=>deleteStory(story.id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
            {tab === "flaggedComments" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-[#2d5a27]">Flagged Comments</h2>
                {flaggedComments.length === 0 ? <div className="text-gray-700">No flagged comments.</div> : flaggedComments.map(comment => (
                  <div key={comment.id} className="border rounded-xl p-4 mb-4 bg-white text-[#2d5a27] shadow">
                    <div className="mb-2 text-gray-700">{comment.text}</div>
                    <a href={`/archive/${comment.storyId}`} target="_blank" rel="noopener noreferrer" className="text-[#4a7c59] underline mr-4">View Story</a>
                    <button className="mr-2 border border-[#4a7c59] text-[#4a7c59] rounded px-3 py-1 text-xs font-semibold transition-colors duration-150 hover:bg-[#5a8c69] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#4a7c59]" onClick={()=>unflagComment(comment.id, comment.storyId)}>Unflag</button>
                    <button className="text-red-600" onClick={()=>deleteComment(comment.id, comment.storyId)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
            {tab === "users" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-[#2d5a27]">User Management</h2>
                {users.length === 0 ? <div className="text-gray-700">No users found.</div> : users.map(u => (
                  <div key={u.id} className="border rounded-xl p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between bg-white text-[#2d5a27] shadow">
                    <div>
                      <div className="font-bold">{u.email}</div>
                      <div className="text-gray-700">Role: {u.role}</div>
                      {u.banned && <div className="text-red-600 font-bold">BANNED</div>}
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      {!u.banned ? <button className="border border-red-300 text-red-600 rounded px-3 py-1 text-xs font-semibold transition-colors duration-150 hover:bg-red-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300" onClick={()=>banUser(u.id)}>Ban</button> : <button className="border border-[#4a7c59] text-[#4a7c59] rounded px-3 py-1 text-xs font-semibold transition-colors duration-150 hover:bg-[#5a8c69] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#4a7c59]" onClick={()=>unbanUser(u.id)}>Unban</button>}
                      <button className="border border-[#4a7c59] text-[#4a7c59] rounded px-3 py-1 text-xs font-semibold transition-colors duration-150 hover:bg-[#5a8c69] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#4a7c59]" onClick={()=>resetPassword(u.email)}>Reset Password</button>
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