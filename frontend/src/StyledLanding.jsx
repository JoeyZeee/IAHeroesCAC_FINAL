import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "./firebase";
import { signOut } from "firebase/auth";
import Navbar from "./components/Navbar";
import { FaRegFileAlt, FaPen, FaHeart, FaSearch, FaGraduationCap, FaShieldAlt } from 'react-icons/fa';

const CARD_EMOJIS = ["🇺🇸", "🙏", "❤️"];

const formatViewCount = (count) => {
  if (count === 0) return "No views yet";
  if (count === 1) return "1 view";
  return `${count} views`;
};

const StarIcon = ({ className = "w-20 h-20 text-green-600" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 48 48">
    <polygon points="24,4 30,18 45,18 33,28 38,44 24,34 10,44 15,28 3,18 18,18" />
  </svg>
);

function StyledLanding() {
  const [featuredStories, setFeaturedStories] = useState([]);
  const [stats, setStats] = useState({ stories: 0, veterans: 0, letters: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth.currentUser);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch featured stories (randomly selected 3)
    const fetchFeaturedStories = async () => {
      try {
        const q = query(collection(db, "stories"));
        const snap = await getDocs(q);
        const allStories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Randomly select 3 stories
        const shuffled = allStories.sort(() => 0.5 - Math.random());
        const selectedStories = shuffled.slice(0, 3);
        
        setFeaturedStories(selectedStories);
      } catch (error) {
        console.error("Error fetching featured stories:", error);
      }
    };

    // Fetch basic statistics
    const fetchStats = async () => {
      try {
        const storiesSnap = await getDocs(collection(db, "stories"));
        const usersSnap = await getDocs(collection(db, "users"));
        const lettersSnap = await getDocs(collection(db, "letters"));
        
        const veteranUsers = usersSnap.docs
          .map(doc => doc.data())
          .filter(user => user.role === "VETERAN");

        setStats({
          stories: storiesSnap.size,
          veterans: veteranUsers.length,
          letters: lettersSnap.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    // Auth state listener
    const unsub = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        // Fetch bookmark count
        try {
          const q = query(collection(db, "bookmarks"));
          const snap = await getDocs(q);
          const userBookmarks = snap.docs
            .map(doc => doc.data())
            .filter(bookmark => bookmark.userId === user.uid);
          setBookmarkCount(userBookmarks.length);
        } catch (error) {
          console.error("Error fetching bookmark count:", error);
          setBookmarkCount(0);
        }
      } else {
        setBookmarkCount(0);
      }
    });

    fetchFeaturedStories();
    fetchStats();

    return () => unsub();
  }, []);

  useEffect(() => {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const handleMouseMove = (e) => {
      createParticle(e.clientX, e.clientY);
    };

    function createParticle(x, y) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.animationDelay = Math.random() * 2 + 's';
      particlesContainer.appendChild(particle);
      setTimeout(() => particle.remove(), 3000);
    }

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="styled-landing">
      {/* Navbar - use shared component for consistency */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section relative flex flex-col items-center justify-center rounded-2xl bg-white shadow-lg mx-auto mt-8 mb-10 max-w-3xl overflow-hidden"
        style={{
          minHeight: '320px',
          background: 'url(/public/Veteran.jpg) center/cover no-repeat'
        }}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col items-center justify-center py-12 px-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4" style={{ color: '#fff', textShadow: '0 2px 12px rgba(44,62,80,0.7)' }}>IAHeroes</h1>
          <p className="text-xl mb-8" style={{ color: '#f3f6f3', textShadow: '0 1px 8px rgba(44,62,80,0.5)' }}>Preserving the stories of Iowa's veterans</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link to="/submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition text-lg">Submit a Story</Link>
            <Link to="/archive" className="bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold px-6 py-3 rounded-lg transition text-lg">Browse Archive</Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="main-content">
        {/* Impact Section */}
        <section className="impact-section grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
          <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center shadow">
            <div className="text-sm text-gray-600 mb-1">Veteran Stories</div>
            <div className="text-3xl font-bold text-green-800">{stats.stories}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center shadow">
            <div className="text-sm text-gray-600 mb-1">Veterans Connected</div>
            <div className="text-3xl font-bold text-green-800">{stats.veterans}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center shadow">
            <div className="text-sm text-gray-600 mb-1">Thank You Letters</div>
            <div className="text-3xl font-bold text-green-800">{stats.letters}</div>
          </div>
        </section>

        {/* Get Started Section */}
        <section className="get-started-section max-w-4xl mx-auto mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#111' }}>Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 feature-card">
              <img src="/public/gs-archive.jpg" alt="Browse Archive" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Browse Archive</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Explore a collection of preserved veteran stories.</div>
              <Link to="/archive" className="bg-green-100 hover:bg-green-200 text-green-900 font-semibold px-4 py-2 rounded transition flex items-center gap-1">Browse <FaRegFileAlt /></Link>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 feature-card">
              <img src="/public/gs-submit.jpg" alt="Submit Story" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Submit Stories</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Share a veteran's story to honor their service.</div>
              <Link to="/submit" className="bg-green-100 hover:bg-green-200 text-green-900 font-semibold px-4 py-2 rounded transition flex items-center gap-1">Submit <FaPen /></Link>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 feature-card">
              <img src="/public/gs-thanks.jpg" alt="Send Thanks" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Send Thanks</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Express gratitude to veterans through heartfelt letters.</div>
              <Link to="/thankyou" className="bg-green-100 hover:bg-green-200 text-green-900 font-semibold px-4 py-2 rounded transition flex items-center gap-1">Send <FaHeart /></Link>
            </div>
          </div>
        </section>

        {/* Portal Access Section */}
        <section className="portal-access-section max-w-4xl mx-auto mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#111' }}>Portal Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 portal-card">
              <img src="/public/portal-veteran.jpg" alt="Veteran Portal" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Veteran Portal</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Access resources and support for veterans.</div>
              <Link to="/veteran" className="bg-green-100 hover:bg-green-200 text-green-900 font-semibold px-4 py-2 rounded transition flex items-center gap-1">Access <FaSearch /></Link>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 portal-card">
              <img src="/public/portal-educator.jpg" alt="Educator Portal" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Educator Portal</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Educational materials for teaching about veterans.</div>
              <Link to="/educator" className="bg-green-100 hover:bg-green-200 text-green-900 font-semibold px-4 py-2 rounded transition flex items-center gap-1">Access <FaGraduationCap /></Link>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 portal-card">
              <img src="/public/portal-moderator.jpg" alt="Moderator Portal" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Moderator Portal</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Tools for managing and reviewing submitted stories.</div>
              <Link to="/moderator" className="bg-green-100 hover:bg-green-200 text-green-900 font-semibold px-4 py-2 rounded transition flex items-center gap-1">Access <FaShieldAlt /></Link>
            </div>
          </div>
        </section>

        {/* Featured Stories Section */}
        {featuredStories.length > 0 && (
          <section className="featured-stories-section max-w-4xl mx-auto mb-10">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#111' }}>Featured Stories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-4">
              {featuredStories.map((story, idx) => (
                <Link to={`/archive/${story.id}`} key={story.id} className="featured-story-card feature-card flex flex-col items-center p-6 w-full h-auto min-h-[320px] transition-transform hover:scale-105 focus:scale-105 rounded-xl shadow">
                  {(story.photoUrl || story.photoURL) ? (
                    <img src={story.photoUrl || story.photoURL || `/public/featured-${idx+1}.jpg`} alt={story.veteranName || 'Veteran'} className="w-24 h-24 object-cover rounded-lg mb-4" />
                  ) : (
                    <StarIcon className="w-24 h-24 text-green-600 mb-4" />
                  )}
                  <div className="w-full text-center">
                    <div className="font-bold text-lg" style={{ color: '#222' }}>{story.veteranName || 'Anonymous'}</div>
                    <div className="text-sm mb-1" style={{ color: '#4a7c59' }}>{story.branch}{story.conflict ? `, ${story.conflict}` : ''}</div>
                    <div className="text-xs" style={{ color: '#7f8c8d' }}>{formatViewCount(story.viewCount || 0)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="cta-section card-style cta-homepage" style={{ background: '#fff', border: '2px solid #4a7c59', borderRadius: '1.5rem', boxShadow: '0 4px 15px rgba(44,62,80,0.08)', padding: '2.5rem 2rem', margin: '1rem auto 1.5rem auto', maxWidth: '500px', textAlign: 'center' }}>
          <h2 className="cta-title" style={{ color: '#2d5a27', fontWeight: 700, fontSize: '2rem', marginBottom: '1rem' }}>Help Preserve Our Veterans' Stories</h2>
          <p className="cta-description" style={{ color: '#222', fontSize: '1.15rem', marginBottom: '2rem' }}>
            Every veteran has a story worth telling. Whether you're a veteran sharing your experience, a family member preserving a loved one's story, or someone wanting to show gratitude, your contribution matters.
          </p>
          <div className="cta-buttons" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/submit" className="btn btn-primary" style={{ background: '#4a7c59', color: '#fff', border: '2px solid #4a7c59', borderRadius: '0.75rem', fontWeight: 600, fontSize: '1.1rem', padding: '0.9rem 2.2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.12)', transition: 'all 0.3s' }}>Share a Story</Link>
            <Link to="/thankyou" className="btn btn-secondary" style={{ background: '#eaf7ea', color: '#2d5a27', border: '2px solid #4a7c59', borderRadius: '0.75rem', fontWeight: 600, fontSize: '1.1rem', padding: '0.9rem 2.2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', transition: 'all 0.3s' }}>Send a Thank You</Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full left-0 bg-green-800 text-white text-center py-3 text-sm shadow-md z-50" style={{ marginTop: '0.5rem' }}>
        © 2025 Joey Zambreno. Created for the purpose of preserving and sharing the stories of Iowa's veterans.
      </footer>

      <style>{`
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
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
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
      `}</style>
      <div className="particles" id="particles"></div>
    </div>
  );
}

export default StyledLanding; 