import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { openUploadWidget } from "./cloudinary";

export default function SubmitStory() {
  const [veteranName, setVeteranName] = useState("");
  const [branch, setBranch] = useState("");
  const [conflict, setConflict] = useState("");
  const [years, setYears] = useState("");
  const [location, setLocation] = useState("");
  const [story, setStory] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [originalAutofilledName, setOriginalAutofilledName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("SubmitStory - Auth state changed:", user ? "Logged in" : "Not logged in");
      setUser(user);
      setAuthLoading(false);
      
      // Autofill the name field when user logs in
      if (user) {
        let autofilledName = "";
        if (user.displayName) {
          autofilledName = user.displayName;
        } else if (user.email) {
          // Extract name from email (everything before @)
          const emailName = user.email.split('@')[0];
          // Capitalize first letter and replace dots/underscores with spaces
          autofilledName = emailName
            .replace(/[._]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        setSubmittedName(autofilledName);
        setOriginalAutofilledName(autofilledName);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const handlePhotoUpload = () => {
    openUploadWidget(
      (url) => {
        setPhotoURL(url);
        setSuccess("Photo uploaded successfully!");
      },
      (error) => {
        setError("Failed to upload photo: " + error.message);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await addDoc(collection(db, "stories"), {
        veteranName,
        branch,
        conflict,
        years,
        location,
        story,
        photoURL,
        submittedBy: user ? user.email : submittedBy,
        submittedName: submittedName,
        createdAt: Timestamp.now(),
      });
      setSuccess("Story submitted successfully! Thank you for contributing.");
      setVeteranName("");
      setBranch("");
      setConflict("");
      setYears("");
      setLocation("");
      setStory("");
      setPhotoURL("");
      setSubmittedName(originalAutofilledName);
      setSubmittedBy("");
    } catch (err) {
      setError("Failed to submit story: " + err.message);
    }
    setLoading(false);
  };

  // Show loading while checking authentication
  if (authLoading) {
    console.log("SubmitStory - Still loading auth state...");
    return (
      <div className="flex-1 w-full bg-us-blue text-us-white">
        <div className="px-6 py-12 bg-us-blue text-us-gold">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-us-gold mx-auto mb-4"></div>
            <p className="text-us-gold">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!user) {
    console.log("SubmitStory - User not authenticated, showing login required");
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
              You must be logged in to submit a story. Please log in to continue.
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

  console.log("SubmitStory - User authenticated, showing form");

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
          background: rgba(245, 230, 178, 0.3);
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

        .submit-container {
          position: relative;
          z-index: 2;
        }
      `}</style>

      {/* Mouse animation particles */}
      <div className="particles" id="particles"></div>

      <div className="submit-container flex-1 w-full bg-us-blue text-us-white">
        {/* Hero Section */}
        <div className="px-6 py-12 bg-us-blue text-us-gold">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-us-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow">Submit a Veteran Story</h1>
            <p className="text-xl text-us-white mb-8 max-w-3xl mx-auto">
              Share a story to honor an Iowa veteran. Your submission will help preserve their legacy for future generations.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {success && (
              <div className="mb-8 p-6 bg-us-gold border border-us-gold rounded-xl text-us-white">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <span className="font-semibold text-lg">{success}</span>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-8 p-6 bg-us-red border border-us-red rounded-xl text-us-white">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="font-semibold text-lg">{error}</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Veteran's Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black"
                    placeholder="Full name of the veteran"
                    value={veteranName}
                    onChange={e => setVeteranName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Branch of Service *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black"
                    placeholder="e.g. Army, Navy, Air Force"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Conflict / War</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black"
                    placeholder="e.g. WWII, Vietnam, Iraq"
                    value={conflict}
                    onChange={e => setConflict(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Years Served</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black"
                    placeholder="e.g. 1944-1946"
                    value={years}
                    onChange={e => setYears(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Location (City, State)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black"
                  placeholder="e.g. Des Moines, IA"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Story *</label>
                <textarea
                  className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black min-h-[120px]"
                  placeholder="Share the veteran's story..."
                  value={story}
                  onChange={e => setStory(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Photo (optional)</label>
                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  className="bg-us-gold text-white font-semibold px-4 py-2 rounded-lg shadow"
                >
                  {photoURL ? "Change Photo" : "Upload Photo"}
                </button>
                {photoURL && (
                  <div className="mt-2">
                    <img src={photoURL} alt="Veteran" className="w-32 h-32 object-cover rounded-lg border border-us-gold" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Your Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black"
                    placeholder="Your full name"
                    value={submittedName}
                    onChange={e => setSubmittedName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Your Email *</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-us-blue rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue bg-us-white text-black placeholder-black"
                    placeholder="your.email@example.com"
                    value={submittedBy}
                    onChange={e => setSubmittedBy(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="text-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-us-red hover:bg-us-gold disabled:bg-us-gold text-us-white hover:text-us-blue font-semibold px-8 py-4 rounded-xl transition text-lg min-w-[200px]"
                >
                  {loading ? "Submitting..." : "Submit Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 
