import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ThankYouLetter() {
  const [veterans, setVeterans] = useState([]);
  const [selectedVeteran, setSelectedVeteran] = useState("");
  const [letter, setLetter] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sendAs, setSendAs] = useState("account");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("ThankYouLetter - Auth state changed:", user ? "Logged in" : "Not logged in");
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return; // Only fetch veterans if user is logged in
    
    async function fetchVeterans() {
      setLoading(true);
      try {
        // Fetch all users with role VETERAN
        const usersSnap = await getDocs(collection(db, "users"));
        const veteranUsers = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.role === "VETERAN" && u.name);
        
        console.log("All veteran users:", veteranUsers);
        
        // Fetch all stories
        const storiesSnap = await getDocs(collection(db, "stories"));
        const stories = storiesSnap.docs.map(doc => doc.data());
        
        console.log("All stories:", stories);
        
        // Only include veterans who have a story with the exact same name
        const eligibleVeterans = veteranUsers.filter(vu => {
          const hasMatchingStory = stories.some(story => 
            story.veteranName && story.veteranName.trim() === vu.name.trim()
          );
          console.log(`Veteran ${vu.name} (${vu.email}) has matching story:`, hasMatchingStory);
          return hasMatchingStory;
        });
        
        console.log("Eligible veterans for thank you letters:", eligibleVeterans);
        setVeterans(eligibleVeterans);
      } catch (e) {
        console.error("Error fetching veterans:", e);
        setVeterans([]);
      }
      setLoading(false);
    }
    fetchVeterans();
  }, [user]);

  const handleSend = async () => {
    setStatus("");
    if (!selectedVeteran || !letter.trim()) {
      setStatus("Please select a veteran and write a letter.");
      return;
    }
    
    const selectedVet = veterans.find(v => v.id === selectedVeteran);
    console.log("Sending letter to veteran:", selectedVet);
    console.log("Selected veteran ID:", selectedVeteran);
    console.log("Current user ID:", user?.uid);
    
    setLoading(true);
    try {
      // Save to Firestore - this will make it appear in the veteran's portal
      const letterData = {
        veteranUserId: selectedVeteran,
        veteranName: selectedVet.name || "",
        letter,
        createdAt: Timestamp.now(),
        sent: true,
        fromUser: sendAs === "account" && user ? user.email : "Anonymous",
      };
      console.log("Saving letter data:", letterData);
      
      await addDoc(collection(db, "letters"), letterData);
      
      setStatus("Letter sent! It will appear in " + selectedVet.name + "'s portal.");
      setLetter(""); // Clear the form
      setSelectedVeteran("");
    } catch (e) {
      setStatus("Failed to send letter: " + e.message);
    }
    setLoading(false);
  };

  // Show loading while checking authentication
  if (authLoading) {
    console.log("ThankYouLetter - Still loading auth state...");
    return (
      <div className="flex-1 w-full bg-white text-black">
        <div className="px-6 py-12 bg-gradient-to-br from-[#f6fcf6] to-[#eaf7ea] text-[#2d5a27]">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-black">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!user) {
    console.log("ThankYouLetter - User not authenticated, showing login required");
    return (
      <div className="flex-1 w-full bg-us-white text-us-blue">
        <div className="px-6 py-12 bg-us-blue/5 text-us-blue">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <svg className="w-16 h-16 text-us-blue" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-us-blue">Login Required</h1>
            <p className="text-xl text-us-blue mb-8">
              You must be logged in to send thank you letters. Please log in to continue.
            </p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-us-blue text-white font-semibold px-8 py-3 rounded-lg text-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log("ThankYouLetter - User authenticated, showing form");

  return (
    <>
      <style jsx>{`
        .particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          pointer-events: none;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.8;
          }
        }

        .thankyou-container {
          position: relative;
          z-index: 2;
        }
      `}</style>

      <div className="thankyou-container flex-1 w-full bg-us-blue text-white">
        {/* Hero Section */}
        <div className="px-6 py-12 bg-us-blue text-white">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow">Send a Thank You Letter</h1>
            <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
              Express your gratitude to Iowa's veterans. Your words of thanks mean the world to those who served.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 p-6 bg-us-blue border border-us-blue rounded-xl">
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 mr-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="font-semibold text-white">Important Note</span>
              </div>
              <p className="text-white">
                You can only send a thank you letter to veterans who have both a user account and a submitted story under the exact same name. If you don't see a veteran here, they may not have both.
              </p>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Select Veteran *</label>
                <select
                  className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black"
                  value={selectedVeteran}
                  onChange={e => setSelectedVeteran(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Choose a veteran --</option>
                  {veterans.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Your Letter *</label>
                <textarea
                  className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black min-h-[200px] resize-vertical"
                  value={letter}
                  onChange={e => setLetter(e.target.value)}
                  placeholder="Write your thank you letter here..."
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">Send as:</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-us-blue rounded-lg hover:bg-us-blue/80 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={sendAs === "account"} 
                      onChange={() => setSendAs("account")}
                      className="text-white"
                    />
                    <div>
                      <div className="font-medium text-white">My account</div>
                      <div className="text-sm text-white">{user?.email || "Not logged in"}</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-us-blue rounded-lg hover:bg-us-blue/80 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={sendAs === "anonymous"} 
                      onChange={() => setSendAs("anonymous")}
                      className="text-white"
                    />
                    <div>
                      <div className="font-medium text-white">Anonymous</div>
                      <div className="text-sm text-white">Send without revealing your identity</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="text-center pt-6">
                <button 
                  className="bg-us-red hover:bg-us-red/90 disabled:bg-gray-400 text-white font-semibold px-8 py-4 rounded-xl transition text-lg min-w-[200px]"
                  onClick={handleSend} 
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Letter"}
                </button>
              </div>
            </form>

            {status && (
              <div className="mt-8 p-6 bg-us-blue border border-us-blue rounded-xl text-white">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 mr-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="font-semibold text-white">Status</span>
                </div>
                <p className="text-white">{status}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 