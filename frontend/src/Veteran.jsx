import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";

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
          setLetters(lettersData);
        } catch (error) {
          console.error("Error fetching letters:", error);
          setLetters([]);
        }
      }
      fetchLetters();
    }
  }, [tab, user]);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d5a27] to-[#4a7c59] text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#4a7c59] mx-auto mb-4"></div>
        <div className="text-2xl text-white font-semibold">Loading...</div>
      </div>
    </div>
  );
  
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
  
  if (!profile || profile.role !== "VETERAN") return (
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f6fcf6] to-[#eaf7ea] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto py-10 px-4 bg-white rounded-2xl shadow-2xl veteran-container">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-[#2d5a27] mb-4 drop-shadow">Veteran Portal</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Access your stories, connect with other veterans, and view thank you letters from the community.
          </p>
        </div>
        <div className="flex gap-4 mb-8 justify-center">
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "profile" ? "bg-[#2d5a27] text-white scale-105" : "bg-white text-[#2d5a27] hover:bg-[#eaf7ea] border border-green-200"}`}
            onClick={() => setTab("profile")}
          >
            Profile
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "letters" ? "bg-[#2d5a27] text-white scale-105" : "bg-white text-[#2d5a27] hover:bg-[#eaf7ea] border border-green-200"}`}
            onClick={() => setTab("letters")}
          >
            Received Letters
          </button>
        </div>

        {tab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-green-100">
              <h3 className="text-2xl font-bold text-green-800 mb-2">My Profile</h3>
              <div className="text-lg font-semibold text-gray-900">{user?.displayName || profile?.name || user?.email}</div>
              <div className="text-gray-700">Email: {user?.email}</div>
              <div className="text-gray-700">Role: {profile?.role}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-green-100">
              <h3 className="text-2xl font-bold text-green-800 mb-2">My Stories</h3>
              {myStories.length === 0 ? (
                <div className="text-gray-500">You haven't submitted any stories yet.</div>
              ) : (
                <ul className="list-disc pl-6 space-y-2 text-gray-900">
                  {myStories.map(story => (
                    <li key={story.id}><span className="font-bold">{story.veteranName}</span> — {story.branch} {story.conflict && `| ${story.conflict}`}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-green-100 md:col-span-2">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Connect with Other Veterans</h3>
              {veterans.length === 0 ? (
                <div className="text-gray-500">No other veterans found.</div>
              ) : (
                <ul className="list-disc pl-6 space-y-2 text-gray-900">
                  {veterans.map(v => (
                    <li key={v.email}>
                      <span className="font-bold">{v.name}</span> — {v.email}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-green-100 md:col-span-2">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Veteran Resources</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-900">
                {RESOURCES.map(r => (
                  <li key={r.name}><a href={r.url} className="text-green-700 underline" target="_blank" rel="noopener noreferrer">{r.name}</a></li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "letters" && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-100">
            <h3 className="text-2xl font-bold text-green-800 mb-4">Received Thank You Letters</h3>
            {letters.length === 0 ? (
              <div className="text-gray-600">No letters received yet.</div>
            ) : (
              <ul className="space-y-4">
                {letters.map(letter => (
                  <li key={letter.id} className="bg-green-50 border border-green-200 rounded shadow p-4 cursor-pointer hover:bg-green-100 transition" onClick={() => { setSelectedLetter(letter); setModalOpen(true); }}>
                    <div className="text-sm text-gray-500 mb-1">
                      From: {letter.fromUser || "Anonymous"} | {letter.createdAt?.toDate ? letter.createdAt.toDate().toLocaleString() : ""}
                    </div>
                    <div className="truncate text-lg text-gray-900 max-w-full">{letter.letter}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {modalOpen && selectedLetter && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-green-700 text-2xl font-bold" onClick={() => setModalOpen(false)}>&times;</button>
              <h4 className="text-xl font-bold text-green-800 mb-2">Thank You Letter</h4>
              <div className="text-sm text-gray-500 mb-2">From: {selectedLetter.fromUser || "Anonymous"}</div>
              <div className="text-sm text-gray-500 mb-4">Received: {selectedLetter.createdAt?.toDate ? selectedLetter.createdAt.toDate().toLocaleString() : ""}</div>
              <div className="whitespace-pre-line text-lg text-gray-900 border-t pt-4">{selectedLetter.letter}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 