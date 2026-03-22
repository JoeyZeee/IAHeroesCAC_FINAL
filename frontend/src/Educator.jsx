import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import emailjs from "emailjs-com";

const LESSON_PLANS = [
  { title: "Iowa Veterans in WWII", url: "#" },
  { title: "Women in Service", url: "#" },
  { title: "Medal of Honor Recipients", url: "#" },
];
const COLLECTIONS = [
  { name: "WWII Stories", description: "Firsthand accounts from Iowa's WWII veterans." },
  { name: "Women in Service", description: "Stories from Iowa's women veterans." },
  { name: "Medal Recipients", description: "Stories of valor and recognition." },
];

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default function Educator() {
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profile");
  const [speakerRequest, setSpeakerRequest] = useState({ name: "", email: "", school: "", details: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
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

  const handleSpeakerRequest = async (e) => {
    e.preventDefault();
    setError("");

    // Validate env vars
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setError("Email service not properly configured. Please contact support.");
      return;
    }

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: speakerRequest.name,
          from_email: speakerRequest.email,
          school: speakerRequest.school,
          message: speakerRequest.details,
          to_email: import.meta.env.VITE_CONTACT_EMAIL,
        },
        EMAILJS_PUBLIC_KEY
      );
      setSubmitted(true);
      setSpeakerRequest({ name: "", email: "", school: "", details: "" });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(`Failed to send request: ${err?.message || JSON.stringify(err)}`);
    }
  };

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
  
  if (!profile || profile.role !== "EDUCATOR") return (
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
      <div className="w-full max-w-4xl mx-auto py-10 px-4 bg-us-white rounded-2xl shadow-2xl educator-container">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-us-red" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-us-blue mb-4 drop-shadow">Educator Portal</h2>
          <p className="text-xl text-us-blue max-w-2xl mx-auto">
            Access educational resources, lesson plans, and request virtual veteran speakers for your classroom.
          </p>
        </div>
        <div className="flex gap-4 mb-8 justify-center">
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "profile" ? "bg-us-blue text-us-white scale-105" : "bg-us-white text-us-blue border border-us-blue"}`}
            onClick={() => setTab("profile")}
          >
            Profile
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "resources" ? "bg-us-blue text-us-white scale-105" : "bg-us-white text-us-blue border border-us-blue"}`}
            onClick={() => setTab("resources")}
          >
            Educational Resources
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold shadow transition-all duration-150 ${tab === "virtual" ? "bg-us-blue text-us-white scale-105" : "bg-us-white text-us-blue border border-us-blue"}`}
            onClick={() => setTab("virtual")}
          >
            Request a Virtual Veteran Visit
          </button>
        </div>

        {tab === "profile" && (
          <div className="bg-us-gold/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col gap-4 border border-us-blue max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-us-blue mb-2">My Profile</h3>
            <div className="text-lg font-semibold text-us-blue">{user?.displayName || profile?.name || user?.email}</div>
            <div className="text-us-blue">Email: {user?.email}</div>
            <div className="text-us-blue">Role: {profile?.role}</div>
          </div>
        )}

        {tab === "resources" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-us-gold/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-us-blue flex flex-col gap-2">
              <h3 className="text-xl font-bold text-us-blue mb-2">Iowa Veterans in WWII</h3>
              <p className="text-us-blue mb-2">Explore the stories, sacrifices, and impact of Iowans during World War II, both on the frontlines and at home. Includes primary sources, documentaries, and lesson plans.</p>
              <a href="https://www.iowapbs.org/iowapathways/mypath/2555/world-war-ii" target="_blank" rel="noopener noreferrer" className="text-us-red underline font-semibold">Iowa Pathways: World War II</a>
              <a href="https://www.pbslearningmedia.org/collection/iowas_world_war_II_stories/" target="_blank" rel="noopener noreferrer" className="text-us-red underline font-semibold">Iowa's WWII Stories (PBS LearningMedia)</a>
            </div>
            <div className="bg-us-gold/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-us-blue flex flex-col gap-2">
              <h3 className="text-xl font-bold text-us-blue mb-2">Women in Service</h3>
              <p className="text-us-blue mb-2">Learn about the vital roles Iowa women played in military and civilian service, including the Women's Army Corps, WAVES, and the Cadet Nurse Corps, with a focus on WWII and beyond.</p>
              <a href="https://www.iowapbs.org/iowapathways/artifact/1515/iowa-veterans-experience-womens-army-corps-wac-during-world-war-ii" target="_blank" rel="noopener noreferrer" className="text-us-red underline font-semibold">Iowa Veteran's Experience in the WAC (PBS)</a>
            </div>
            <div className="bg-us-gold/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-us-blue flex flex-col gap-2 md:col-span-2">
              <h3 className="text-xl font-bold text-us-blue mb-2">Medal of Honor Recipients</h3>
              <p className="text-us-blue mb-2">Discover Iowa's Medal of Honor recipients and access lesson plans, living histories, and character education resources from the Congressional Medal of Honor Society.</p>
              <a href="https://www.cmohs.org/lessons/resources" target="_blank" rel="noopener noreferrer" className="text-us-red underline font-semibold">Medal of Honor Society: Educator Resources</a>
            </div>
          </div>
        )}

        {tab === "virtual" && (
          <div className="bg-us-gold/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-us-blue max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-us-blue mb-4">Request a Virtual Veteran Visit</h3>
            <p className="text-us-blue mb-4">Fill out the form below to request a virtual veteran speaker for your classroom or event.</p>
            {submitted ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p className="font-semibold">Thank you!</p>
                <p>Your request has been submitted successfully. We will be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSpeakerRequest} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  className="w-full border border-us-blue rounded px-3 py-2 bg-us-white text-black placeholder-black" 
                  placeholder="Your Name"
                  value={speakerRequest.name}
                  onChange={(e) => setSpeakerRequest({...speakerRequest, name: e.target.value})}
                  required
                />
                <input 
                  type="email" 
                  className="w-full border border-us-blue rounded px-3 py-2 bg-us-white text-black placeholder-black" 
                  placeholder="Your Email"
                  value={speakerRequest.email}
                  onChange={(e) => setSpeakerRequest({...speakerRequest, email: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  className="w-full border border-us-blue rounded px-3 py-2 bg-us-white text-black placeholder-black" 
                  placeholder="School/Organization"
                  value={speakerRequest.school}
                  onChange={(e) => setSpeakerRequest({...speakerRequest, school: e.target.value})}
                />
                <textarea 
                  className="w-full border border-us-blue rounded px-3 py-2 min-h-[100px] bg-us-white text-black placeholder-black" 
                  placeholder="Details about your request (date, grade level, topics, etc.)"
                  value={speakerRequest.details}
                  onChange={(e) => setSpeakerRequest({...speakerRequest, details: e.target.value})}
                  required
                />
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <button type="submit" className="bg-us-blue text-us-white font-semibold px-6 py-2 rounded">Submit Request</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
