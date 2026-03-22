import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { signOut } from "firebase/auth";
import Navbar from "./components/Navbar";
import { FaRegFileAlt, FaPen, FaHeart, FaSearch, FaGraduationCap, FaShieldAlt } from 'react-icons/fa';

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
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.role === "VETERAN");

        const veteranIds = new Set(veteranUsers.map(user => user.id));

        let validLettersCount = 0;
        for (const letterDoc of lettersSnap.docs) {
          const letterData = letterDoc.data();
          if (letterData && letterData.veteranUserId && veteranIds.has(letterData.veteranUserId)) {
            validLettersCount += 1;
          } else {
            // prune orphan letter entries
            try {
              await deleteDoc(doc(db, "letters", letterDoc.id));
            } catch (delErr) {
              console.warn("Failed to prune orphan letter doc:", letterDoc.id, delErr);
            }
          }
        }

        setStats({
          stories: storiesSnap.size,
          veterans: veteranUsers.length,
          letters: validLettersCount
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
    // Remove the animated/particle background and use a solid color for the main wrapper:
    // Replace the outermost <div className="styled-landing"> with:
    // <div className="styled-landing bg-us-blue min-h-screen w-full">
    //   {/* Navbar - use shared component for consistency */}
    //   <Navbar />
    //   {/* ...rest of homepage content... */}
    // </div>
    // Remove any code related to particles, animation, or background effects.
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="styled-landing bg-us-blue min-h-screen w-full">
      <Navbar />
      {/* Hero Section */}
      <section className="max-w-3xl mx-auto mt-10 mb-12 p-8 bg-white/95 rounded-2xl shadow-xl flex flex-col items-center text-center">
        <h1 className="text-5xl font-extrabold mb-4 text-us-blue drop-shadow">IAHeroes</h1>
        <p className="text-xl mb-8 text-us-blue">Preserving the stories of Iowa's veterans for future generations. Explore, contribute, and honor the legacy of our heroes.</p>
        <div className="flex gap-4 flex-wrap justify-center mb-2">
          <Link to="/submit" className="bg-us-blue text-us-white font-semibold px-6 py-3 rounded-lg text-lg" style={{ color: '#fff' }}>Submit a Story</Link>
          <Link to="/archive" className="bg-us-blue text-us-white font-semibold px-6 py-3 rounded-lg text-lg border border-us-blue" style={{ color: '#fff' }}>Browse Archive</Link>
        </div>
      </section>

      {/* Impact Section */}
      <section className="max-w-5xl mx-auto mb-12 p-8 bg-white rounded-2xl shadow flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-us-blue">Our Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
          <div className="bg-us-blue/10 rounded-xl p-6 flex flex-col items-center shadow">
            <div className="text-sm text-us-blue mb-1">Veteran Stories</div>
            <div className="text-3xl font-bold text-us-blue">{stats.stories}</div>
          </div>
          <div className="bg-us-blue/10 rounded-xl p-6 flex flex-col items-center shadow">
            <div className="text-sm text-us-blue mb-1">Veterans Connected</div>
            <div className="text-3xl font-bold text-us-blue">{stats.veterans}</div>
          </div>
          <div className="bg-us-blue/10 rounded-xl p-6 flex flex-col items-center shadow">
            <div className="text-sm text-us-blue mb-1">Thank You Letters</div>
            <div className="text-3xl font-bold text-us-blue">{stats.letters}</div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="max-w-5xl mx-auto mb-12 p-8 bg-white rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4 text-us-blue">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 feature-card">
              <img src="/public/gs-archive.jpg" alt="Browse Archive" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Browse Archive</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Explore a collection of preserved veteran stories.</div>
              <Link to="/archive" className="bg-us-blue text-us-white font-semibold px-4 py-2 rounded flex items-center gap-1" style={{ color: '#fff' }}>Browse <FaRegFileAlt color="#fff" /></Link>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 feature-card">
              <img src="/public/gs-submit.jpg" alt="Submit Story" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Submit Stories</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Share a veteran's story to honor their service.</div>
              <Link to="/submit" className="bg-us-blue text-us-white font-semibold px-4 py-2 rounded flex items-center gap-1" style={{ color: '#fff' }}>Submit <FaPen color="#fff" /></Link>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 feature-card">
              <img src="/public/gs-thanks.jpg" alt="Send Thanks" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Send Thanks</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Express gratitude to veterans through heartfelt letters.</div>
              <Link to="/thankyou" className="bg-us-blue text-us-white font-semibold px-4 py-2 rounded flex items-center gap-1" style={{ color: '#fff' }}>Send <FaHeart color="#fff" /></Link>
            </div>
          </div>
      </section>

      {/* Portal Access Section */}
      <section className="max-w-5xl mx-auto mb-12 p-8 bg-white rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4 text-us-blue">Portal Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 portal-card">
              <img src="/public/portal-veteran.jpg" alt="Veteran Portal" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Veteran Portal</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Access resources and support for veterans.</div>
              <Link to="/veteran" className="bg-us-blue text-us-white font-semibold px-4 py-2 rounded flex items-center gap-1" style={{ color: '#fff' }}>Access <FaSearch color="#fff" /></Link>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 portal-card">
              <img src="/public/portal-educator.jpg" alt="Educator Portal" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Educator Portal</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Educational materials for teaching about veterans.</div>
              <Link to="/educator" className="bg-us-blue text-us-white font-semibold px-4 py-2 rounded flex items-center gap-1" style={{ color: '#fff' }}>Access <FaGraduationCap color="#fff" /></Link>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col items-center p-6 portal-card">
              <img src="/public/portal-moderator.jpg" alt="Moderator Portal" className="w-28 h-24 object-cover rounded-lg mb-4" />
              <div className="font-semibold mb-2" style={{ color: '#111' }}>Moderator Portal</div>
              <div className="text-sm text-gray-500 mb-3 text-center">Tools for managing and reviewing submitted stories.</div>
              <Link to="/moderator" className="bg-us-blue text-us-white font-semibold px-4 py-2 rounded flex items-center gap-1" style={{ color: '#fff' }}>Access <FaShieldAlt color="#fff" /></Link>
            </div>
          </div>
      </section>

      {/* Featured Stories Section */}
      <section className="max-w-5xl mx-auto mb-12 p-8 bg-white rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4 text-us-blue">Featured Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredStories.map((story, idx) => (
            <Link to={`/archive/${story.id}`} key={story.id} className="featured-story-card feature-card flex flex-col items-center p-6 w-full h-auto min-h-[320px] rounded-xl shadow bg-us-white">
              {(story.photoUrl || story.photoURL) ? (
                <img src={story.photoUrl || story.photoURL || `/public/featured-${idx+1}.jpg`} alt={story.veteranName || 'Veteran'} className="w-24 h-24 object-cover rounded-lg mb-4" />
              ) : (
                <svg className="w-24 h-24 text-us-red mb-4" fill="currentColor" viewBox="0 0 48 48">
                  <polygon points="24,4 30,18 45,18 33,28 38,44 24,34 10,44 15,28 3,18 18,18" />
                </svg>
              )}
              <div className="w-full text-center">
                <div className="font-bold text-lg text-us-blue">{story.veteranName || 'Anonymous'}</div>
                <div className="text-sm text-us-blue mb-2">{story.branch} {story.conflict && <>• {story.conflict}</>}</div>
                <div className="text-us-blue text-sm mb-2">{story.story}</div>
                <div className="text-xs text-us-blue">{formatViewCount(story.viewCount || 0)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="w-full text-center text-us-white py-6 mt-8">© 2025 Joey Zambreno. Created for the purpose of preserving and sharing the stories of Iowa's veterans.</footer>
    </div>
  );
}

export default StyledLanding; 
