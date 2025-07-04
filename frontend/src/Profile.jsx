import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";

export default function Profile() {
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ posts: 0, commentsGiven: 0, commentsReceived: 0, reactionsGiven: 0, reactionsReceived: 0 });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setError("");
      if (u) {
        try {
          const ref = doc(db, "users", u.uid);
          let snap = await getDoc(ref);
          if (!snap.exists()) {
            // Create user doc if missing (for Google sign-in or legacy users)
            await setDoc(ref, {
              name: u.displayName || "",
              email: u.email,
              role: "STUDENT",
            });
            snap = await getDoc(ref);
          }
          setProfile(snap.exists() ? snap.data() : null);
        } catch (err) {
          setError("Failed to load profile: " + err.message);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchStats() {
      // Posts made
      const postsSnap = await getDocs(query(collection(db, "stories"), where("submittedBy", "==", user.email)));
      // Comments given
      let commentsGiven = 0;
      let reactionsGiven = 0;
      let commentsReceived = 0;
      let reactionsReceived = 0;
      const storiesSnap = await getDocs(collection(db, "stories"));
      for (const storyDoc of storiesSnap.docs) {
        const storyId = storyDoc.id;
        // Comments given
        const commentsSnap = await getDocs(collection(db, "stories", storyId, "comments"));
        commentsGiven += commentsSnap.docs.filter(doc => doc.data().userId === user.uid).length;
        // Comments received (on user's stories)
        if (storyDoc.data().submittedBy === user.email) {
          commentsReceived += commentsSnap.size;
        }
        // Reactions given
        const reactionsSnap = await getDocs(collection(db, "stories", storyId, "reactions"));
        reactionsGiven += reactionsSnap.docs.filter(doc => doc.data().userId === user.uid).length;
        // Reactions received (on user's stories)
        if (storyDoc.data().submittedBy === user.email) {
          reactionsReceived += reactionsSnap.size;
        }
      }
      setStats({
        posts: postsSnap.size,
        commentsGiven,
        commentsReceived,
        reactionsGiven,
        reactionsReceived,
      });
    }
    fetchStats();
  }, [user]);

  if (loading) return (
    <div className="flex-1 w-full bg-gradient-to-br from-[#2d5a27] to-[#4a7c59] text-white">
      <div className="px-6 py-12 bg-gradient-to-br from-[#2d5a27] to-[#4a7c59] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-green-100">Loading profile...</p>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex-1 w-full bg-gradient-to-br from-red-900 via-red-800 to-red-700 text-white">
      <div className="px-6 py-12 bg-gradient-to-br from-red-900 via-red-800 to-red-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-xl text-red-100 mb-8">{error}</p>
        </div>
      </div>
    </div>
  );
  
  if (!user) return (
    <div className="flex-1 w-full bg-gradient-to-br from-[#2d5a27] to-[#4a7c59] text-white">
      <div className="px-6 py-12 bg-gradient-to-br from-[#2d5a27] to-[#4a7c59] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-4xl font-bold mb-4">Login Required</h1>
          <p className="text-xl text-green-100 mb-8">Please log in to view your profile.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-white text-[#2d5a27] hover:bg-green-50 font-semibold px-8 py-3 rounded-lg transition text-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="flex-1 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
      <div className="px-6 py-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">❓</div>
          <h1 className="text-4xl font-bold mb-4">No Profile Data</h1>
          <p className="text-xl text-gray-100 mb-8">No profile data found.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full bg-white text-black">
      {/* Hero Section */}
      <div className="px-6 py-12 bg-gradient-to-br from-[#f6fcf6] to-[#eaf7ea] text-[#2d5a27]">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow">My Profile</h1>
          <p className="text-xl text-green-900 mb-8 max-w-3xl mx-auto">
            Manage your account and view your activity on IAHeroes.
          </p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-green-100">
            <h2 className="text-2xl font-bold text-[#2d5a27] mb-6">Account Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-green-50 rounded-lg">
                <span className="font-semibold text-gray-700 w-32 mb-2 sm:mb-0">Name:</span>
                <span className="flex-1 text-gray-900">{profile.name || "Not set"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-green-50 rounded-lg">
                <span className="font-semibold text-gray-700 w-32 mb-2 sm:mb-0">Email:</span>
                <span className="flex-1 text-gray-900">{user.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-green-50 rounded-lg">
                <span className="font-semibold text-gray-700 w-32 mb-2 sm:mb-0">User Type:</span>
                <span className="flex-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    profile.role === 'VETERAN' ? 'bg-green-100 text-green-800' :
                    profile.role === 'EDUCATOR' ? 'bg-green-50 text-[#2d5a27]' :
                    profile.role === 'MODERATOR' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {profile.role}
                    {user && user.uid === "VFNN3G45mcaMAFFDmT3IwsZmWgp2" && (
                      <span className="ml-2 font-bold text-purple-700">/ MODERATOR</span>
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Activity Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
            <h2 className="text-2xl font-bold text-[#2d5a27] mb-6">Your Activity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-[#2d5a27] mb-2">{stats.posts}</div>
                <div className="text-sm font-semibold text-gray-700">Stories Shared</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.commentsGiven}</div>
                <div className="text-sm font-semibold text-gray-700">Comments Given</div>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-xl">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.commentsReceived}</div>
                <div className="text-sm font-semibold text-gray-700">Comments Received</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">{stats.reactionsGiven}</div>
                <div className="text-sm font-semibold text-gray-700">Reactions Given</div>
              </div>
              <div className="text-center p-6 bg-pink-50 rounded-xl">
                <div className="text-3xl font-bold text-pink-600 mb-2">{stats.reactionsReceived}</div>
                <div className="text-sm font-semibold text-gray-700">Reactions Received</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 