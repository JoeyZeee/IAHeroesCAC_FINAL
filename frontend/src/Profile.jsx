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
    <div className="flex-1 w-full bg-us-blue text-us-white">
      <div className="px-6 py-12 bg-us-blue text-us-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-us-white mx-auto mb-4"></div>
          <p className="text-us-gold">Loading profile...</p>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex-1 w-full bg-us-red text-us-white">
      <div className="px-6 py-12 bg-us-red text-us-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-xl text-us-white mb-8">{error}</p>
        </div>
      </div>
    </div>
  );
  
  if (!user) return (
    <div className="flex-1 w-full bg-us-blue text-us-white">
      <div className="px-6 py-12 bg-us-blue text-us-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-4xl font-bold mb-4">Login Required</h1>
          <p className="text-xl text-us-gold mb-8">Please log in to view your profile.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-us-white text-us-blue hover:bg-us-gold font-semibold px-8 py-3 rounded-lg transition text-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="flex-1 w-full bg-us-white text-us-blue">
      <div className="px-6 py-12 bg-us-white text-us-blue">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">❓</div>
          <h1 className="text-4xl font-bold mb-4">No Profile Data</h1>
          <p className="text-xl text-us-blue mb-8">No profile data found.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full bg-us-white text-us-blue">
      {/* Hero Section */}
      <div className="px-6 py-12 bg-us-blue text-us-gold">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow">My Profile</h1>
          <p className="text-xl text-us-white mb-8 max-w-3xl mx-auto">
            Manage your account and view your activity on IAHeroes.
          </p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Information */}
          <div className="bg-us-gold rounded-xl shadow-lg p-8 mb-8 border border-us-blue">
            <h2 className="text-2xl font-bold text-us-blue mb-6">Account Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-us-white rounded-lg">
                <span className="font-semibold text-us-blue w-32 mb-2 sm:mb-0">Name:</span>
                <span className="flex-1 text-us-blue">{profile.name || "Not set"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-us-white rounded-lg">
                <span className="font-semibold text-us-blue w-32 mb-2 sm:mb-0">Email:</span>
                <span className="flex-1 text-us-blue">{user.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-us-white rounded-lg">
                <span className="font-semibold text-us-blue w-32 mb-2 sm:mb-0">User Type:</span>
                <span className="flex-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    profile.role === 'VETERAN' ? 'bg-us-gold text-us-blue' :
                    profile.role === 'EDUCATOR' ? 'bg-us-gold text-us-blue' :
                    profile.role === 'MODERATOR' ? 'bg-us-gold text-us-red' :
                    'bg-us-white text-us-blue'
                  }`}>
                    {profile.role}
                    {user && user.uid === "VFNN3G45mcaMAFFDmT3IwsZmWgp2" && (
                      <span className="ml-2 font-bold text-us-red">/ MODERATOR</span>
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Activity Statistics */}
          <div className="bg-us-gold rounded-xl shadow-lg p-8 border border-us-blue">
            <h2 className="text-2xl font-bold text-us-blue mb-6">Your Activity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center p-6 bg-us-white rounded-xl">
                <div className="text-3xl font-bold text-us-red mb-2">{stats.posts}</div>
                <div className="text-sm font-semibold text-us-blue">Stories Shared</div>
              </div>
              <div className="text-center p-6 bg-us-white rounded-xl">
                <div className="text-3xl font-bold text-us-red mb-2">{stats.commentsGiven}</div>
                <div className="text-sm font-semibold text-us-blue">Comments Given</div>
              </div>
              <div className="text-center p-6 bg-us-white rounded-xl">
                <div className="text-3xl font-bold text-us-red mb-2">{stats.commentsReceived}</div>
                <div className="text-sm font-semibold text-us-blue">Comments Received</div>
              </div>
              <div className="text-center p-6 bg-us-white rounded-xl">
                <div className="text-3xl font-bold text-us-red mb-2">{stats.reactionsGiven}</div>
                <div className="text-sm font-semibold text-us-blue">Reactions Given</div>
              </div>
              <div className="text-center p-6 bg-us-white rounded-xl">
                <div className="text-3xl font-bold text-us-red mb-2">{stats.reactionsReceived}</div>
                <div className="text-sm font-semibold text-us-blue">Reactions Received</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 