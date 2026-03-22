import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy, updateDoc } from "firebase/firestore";

const RESOURCES = [
  { name: "VA Benefits", url: "https://www.va.gov/" },
  { name: "Iowa Department of Veterans Affairs", url: "https://va.iowa.gov/" },
  { name: "Veterans Crisis Line", url: "https://www.veteranscrisisline.net/" },
];

export default function Veteran() {
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myStories, setMyStories] = useState([]);
  const [veterans, setVeterans] = useState([]);
  const [letters, setLetters] = useState([]);
  const [tab, setTab] = useState("profile");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        setProfile(snap.exists() ? snap.data() : null);
        // Fetch my stories
        const storiesSnap = await getDocs(query(collection(db, "stories"), where("submittedBy", "==", u.email)));
        setMyStories(storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // Fetch other veterans
        const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "VETERAN")));
        setVeterans(
          usersSnap.docs
            .map(doc => doc.data())
            .filter(v => v.email !== u.email && v.name && v.name.trim() !== "")
        );
      } else {
        setProfile(null);
        setMyStories([]);
        setVeterans([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (tab === "letters" && user) {
      async function fetchLetters() {
        console.log("Fetching letters for user:", user.uid);
        try {
          // First try a simple query without orderBy
          const q = query(
            collection(db, "letters"),
            where("veteranUserId", "==", user.uid)
          );
          const snap = await getDocs(q);
          const lettersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log("Found letters:", lettersData);
          console.log("Letters data details:", lettersData.map(l => ({ id: l.id, veteranUserId: l.veteranUserId, veteranName: l.veteranName, fromUser: l.fromUser })));
          // Filter out cleared letters
          const activeLetters = lettersData.filter(letter => !letter.cleared);
          setLetters(activeLetters);
        } catch (error) {
          console.error("Error fetching letters:", error);
          setLetters([]);
        }
      }
      fetchLetters();
    }
  }, [tab, user]);

  const clearLetter = async (letterId) => {
    try {
      await updateDoc(doc(db, "letters", letterId), { cleared: true });
      // Remove from local state
      setLetters(prev => prev.filter(letter => letter.id !== letterId));
    } catch (error) {
      console.error("Error clearing letter:", error);
      alert("Failed to clear letter");
    }
  };

  useEffect(() => {
    // Mouse animation effect
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    let mouseX = 0;
    let mouseY = 0;

    // Track mouse movement
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Create new particle at mouse position
      createParticle(mouseX, mouseY);
    };

    function createParticle(x, y) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      
      // Random animation delay
      particle.style.animationDelay = Math.random() * 2 + 's';
      
      particlesContainer.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 3000);
    }

    // Create background particles
    function createBackgroundParticles() {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = Math.random() * window.innerHeight + 'px';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        particlesContainer.appendChild(particle);
      }
    }

    createBackgroundParticles();

    // Recreate background particles on window resize
    const handleResize = () => {
      particlesContainer.innerHTML = '';
      createBackgroundParticles();
    };

    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-us-blue text-us-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-us-gold mx-auto mb-4"></div>
        <div className="text-2xl text-us-white font-semibold">Loading...</div>
      </div>
    </div>
  );
  
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
  
  if (!profile || profile.role !== "VETERAN") return (
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

  return (
    <div className="min-h-screen w-full bg-us-blue flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto py-10 px-4 bg-us-white rounded-2xl shadow-2xl veteran-container">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-us-red" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-us-blue mb-4 drop-shadow">Veteran Portal</h2>
          <p className="text-xl text-us-blue max-w-2xl mx-auto">
            Access your stories, connect with other veterans, and view thank you letters from the community.
          </p>
        </div>
        <div className="flex gap-4 mb-8 justify-center">
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "profile" ? "bg-us-red text-us-white scale-105" : "bg-us-white text-us-blue hover:bg-us-gold border border-us-blue"}`}
            onClick={() => setTab("profile")}
          >
            Profile
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "letters" ? "bg-us-red text-us-white scale-105" : "bg-us-white text-us-blue hover:bg-us-gold border border-us-blue"}`}
            onClick={() => setTab("letters")}
          >
            Received Letters
          </button>
        </div>

        {tab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-us-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-us-blue">
              <h3 className="text-2xl font-bold text-us-blue mb-2">My Profile</h3>
              <div className="text-lg font-semibold text-us-blue">{user?.displayName || profile?.name || user?.email}</div>
              <div className="text-us-blue">Email: {user?.email}</div>
              <div className="text-us-blue">Role: {profile?.role}</div>
            </div>
            <div className="bg-us-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-us-blue">
              <h3 className="text-2xl font-bold text-us-blue mb-2">My Stories</h3>
              {myStories.length === 0 ? (
                <div className="text-us-blue">You haven't submitted any stories yet.</div>
              ) : (
                <ul className="list-disc pl-6 space-y-2 text-us-blue">
                  {myStories.map(story => (
                    <li key={story.id}><span className="font-bold">{story.veteranName}</span> — {story.branch} {story.conflict && `| ${story.conflict}`}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-us-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-us-blue md:col-span-2">
              <h3 className="text-2xl font-bold text-us-blue mb-2">Connect with Other Veterans</h3>
              {veterans.length === 0 ? (
                <div className="text-us-blue">No other veterans found.</div>
              ) : (
                <ul className="list-disc pl-6 space-y-2 text-us-blue">
                  {veterans.map(v => (
                    <li key={v.email}>
                      <span className="font-bold">{v.name}</span> — {v.email}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-us-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-us-blue md:col-span-2">
              <h3 className="text-2xl font-bold text-us-blue mb-2">Veteran Resources</h3>
              <ul className="list-disc pl-6 space-y-2 text-us-blue">
                {RESOURCES.map(r => (
                  <li key={r.name}><a href={r.url} className="text-us-red underline" target="_blank" rel="noopener noreferrer">{r.name}</a></li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "letters" && (
          <div className="bg-us-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-us-blue">
            <h3 className="text-2xl font-bold text-us-red mb-4">Received Thank You Letters</h3>
            {letters.length === 0 ? (
              <div className="text-us-blue">No letters received yet.</div>
            ) : (
              <ul className="space-y-4">
                {letters.map(letter => (
                  <li key={letter.id} className="bg-us-gold border border-us-blue rounded shadow p-4 cursor-pointer hover:bg-us-gold transition relative" onClick={() => { setSelectedLetter(letter); setModalOpen(true); }}>
                    <div className="text-sm text-us-blue mb-1">
                      From: {letter.fromUser || "Anonymous"} | {letter.createdAt?.toDate ? letter.createdAt.toDate().toLocaleString() : ""}
                    </div>
                    <div className="text-us-blue text-lg whitespace-pre-line">{letter.letter}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearLetter(letter.id);
                      }}
                      className="absolute top-2 right-2 bg-us-red text-us-white px-2 py-1 rounded text-sm font-semibold hover:bg-red-600 transition-colors"
                      title="Clear this letter"
                    >
                      Clear
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {modalOpen && selectedLetter && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-us-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-0 right-0 m-6 w-16 h-16 rounded-xl bg-us-red flex items-center justify-center"
                style={{ transition: 'none' }}
              >
                <svg className="w-8 h-8 text-us-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
              <h4 className="text-xl font-bold text-us-red mb-2">Thank You Letter</h4>
              <div className="text-sm text-us-blue mb-2">From: {selectedLetter.fromUser || "Anonymous"}</div>
              <div className="text-sm text-us-blue mb-4">Received: {selectedLetter.createdAt?.toDate ? selectedLetter.createdAt.toDate().toLocaleString() : ""}</div>
              <div className="whitespace-pre-line text-lg text-us-blue border-t pt-4">{selectedLetter.letter}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
