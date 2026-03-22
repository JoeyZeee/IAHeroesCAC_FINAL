import React, { useEffect, useState } from "react";
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { FaUserGraduate, FaUserShield, FaShieldAlt, FaMedal, FaEye, FaTrash, FaFlag, FaPrayingHands, FaHeart } from 'react-icons/fa';
import app from "./firebase";
import AuthForm from "./components/AuthForm";
import { auth, db, storage } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import Profile from "./Profile";
import Navbar from "./components/Navbar";
import { collection, addDoc, Timestamp, getDocs, query, orderBy, getCountFromServer, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SubmitStory from "./SubmitStory";
import StoryDetail from "./StoryDetail";
import Educator from "./Educator";
import Veteran from "./Veteran";
import ThankYouLetter from "./ThankYouLetter";
import { onAuthStateChanged } from "firebase/auth";
import Moderator from "./Moderator";
import { AuthProvider, useAuth } from "./components/AuthContext";
import StyledLanding from "./StyledLanding";

const CARD_ICON_COMPONENTS = [FaFlag, FaPrayingHands, FaHeart];

const formatViewCount = (count) => {
  if (count === 0) return "No views yet";
  if (count === 1) return "1 view";
  return `${count} views`;
};

function StoryCard({
  story,
  storyId,
  onNavigate,
  onToggleBookmark,
  isBookmarked = false,
  onFlag,
  commentCount = 0,
  reactionCount = 0,
}) {
  const iconIndex = storyId?.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % CARD_ICON_COMPONENTS.length;
  const Icon = CARD_ICON_COMPONENTS[iconIndex] || FaFlag;

  return (
    <div
      className="bg-us-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-us-red relative"
      onClick={() => onNavigate && onNavigate(`/archive/${storyId}`)}
    >
      <div className="w-full h-48 bg-us-blue flex items-center justify-center overflow-hidden">
        {story.photoURL ? (
          <img
            src={story.photoURL}
            alt={story.veteranName || "Veteran photo"}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Icon className="w-16 h-16 text-us-white" />
        )}
      </div>
      <div className="p-6">
        <div className="font-bold text-2xl mb-2 text-us-red">{story.veteranName || "Anonymous Veteran"}</div>
        <div className="text-lg text-us-blue mb-2">
          {story.branch} {story.conflict && <>• {story.conflict}</>}
        </div>
        <div className="text-base text-us-blue mb-3">
          {story.years && <>Years: {story.years}</>} {story.location && <>• {story.location}</>}
        </div>
        <div className="text-us-blue text-sm mb-4 line-clamp-3">{story.story}</div>
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-us-red font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
              {commentCount}
            </span>
            <span className="flex items-center gap-1 text-us-red font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {reactionCount}
            </span>
            <span className="flex items-center gap-1 text-us-blue">
              <FaEye className="w-4 h-4" /> {formatViewCount(story.viewCount || 0)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark && onToggleBookmark(storyId, story);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                isBookmarked ? "bg-us-blue text-us-white" : "bg-us-white text-us-blue border border-us-blue"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFlag && onFlag(storyId);
              }}
              className="px-3 py-1 rounded-lg bg-us-red text-us-white font-semibold"
              title="Flag story"
            >
              Flag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex flex-col min-h-screen w-full bg-us-blue">
        <div className="flex-1 flex flex-col">{children}</div>
      </main>
      <footer className="w-full left-0 bg-us-blue text-us-white text-center py-3 text-sm shadow-md z-50">
        © 2026 Joey Zambreno. Created for the purpose of preserving and sharing the stories of Iowa's veterans.
      </footer>
    </>
  );
}

function Home() {
  const [featuredStories, setFeaturedStories] = useState([]);
  const [stats, setStats] = useState({ stories: 0, veterans: 0, letters: 0 });

  useEffect(() => {
    // Fetch featured stories (randomly selected 3)
    const fetchFeaturedStories = async () => {
      try {
        // Get all stories first
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

        // Ensure letters count only includes letters for a veteran that still exists
        let validLettersCount = 0;
        for (const letterDoc of lettersSnap.docs) {
          const letterData = letterDoc.data();
          if (letterData && letterData.veteranUserId && veteranIds.has(letterData.veteranUserId)) {
            validLettersCount += 1;
          } else {
            // Optionally prune orphan letter entries
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

    fetchFeaturedStories();
    fetchStats();
  }, []);

  return (
    <div className="flex-1 w-full bg-us-blue text-us-white">
      {/* Hero Section */}
      <div className="px-6 py-12 bg-us-blue text-us-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="block text-6xl sm:text-7xl mb-4 flex items-center justify-center gap-3" aria-label="United States Flag and Medal">
            <FaFlag className="w-14 h-14 text-us-red" aria-hidden="true" />
            <FaMedal className="w-14 h-14 text-yellow-300" aria-hidden="true" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow text-us-white">IAHeroes</h1>
          <p className="text-xl sm:text-2xl text-us-white mb-8 max-w-3xl mx-auto">
            Preserving the stories of Iowa's veterans for future generations. 
            Explore, contribute, and honor the legacy of our heroes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="/submit" className="bg-us-red text-us-white font-semibold px-8 py-3 rounded-lg transition text-lg">
              Submit a Story
            </a>
            <a href="/archive" className="bg-us-white border-2 border-us-red text-us-blue font-semibold px-8 py-3 rounded-lg transition text-lg">
              Browse Archive
            </a>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="px-6 py-12 bg-us-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-us-blue mb-8">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-us-red mb-2">{stats.stories}</div>
              <div className="text-lg text-us-blue">Veteran Stories</div>
              <div className="text-sm text-us-white">Preserved and shared</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-us-red mb-2">{stats.veterans}</div>
              <div className="text-lg text-us-blue">Veterans</div>
              <div className="text-sm text-us-white">Connected through stories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-us-red mb-2">{stats.letters}</div>
              <div className="text-lg text-us-blue">Thank You Letters</div>
              <div className="text-sm text-us-white">Sent to veterans</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-12 bg-us-blue">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-us-white mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link to="/veteran" className="bg-us-blue rounded-xl p-6 shadow-lg text-center hover:bg-us-white transition-colors cursor-pointer group text-us-white">
              <FaUserShield className="w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform text-us-red" />
              <div className="font-bold text-lg mb-2 text-us-blue">Veteran Portal</div>
              <div className="text-sm text-us-blue">Access your stories and connect with other veterans</div>
            </Link>
            <Link to="/educator" className="bg-us-blue rounded-xl p-6 shadow-lg text-center hover:bg-us-white transition-colors cursor-pointer group text-us-white">
              <FaUserGraduate className="w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform text-us-red" />
              <div className="font-bold text-lg mb-2 text-us-blue">Educator Portal</div>
              <div className="text-sm text-us-blue">Access educational resources and request virtual veterans</div>
            </Link>
            <Link to="/moderator" className="bg-us-blue rounded-xl p-6 shadow-lg text-center hover:bg-us-white transition-colors cursor-pointer group text-us-white">
              <FaShieldAlt className="w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform text-us-red" />
              <div className="font-bold text-lg mb-2 text-us-blue">Moderator Portal</div>
              <div className="text-sm text-us-blue">Review, manage, and moderate user content</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Stories */}
      {featuredStories.length > 0 && (
        <div className="px-6 py-12 bg-us-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-us-blue mb-8">Featured Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredStories.map((story, idx) => {
                const iconIndex = story.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % CARD_ICON_COMPONENTS.length;
                const Icon = CARD_ICON_COMPONENTS[iconIndex] || FaFlag;
                return (
                  <div key={story.id} className="bg-us-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => window.location.href = `/archive/${story.id}`}>
                    <div className="w-full h-32 bg-us-white rounded mb-4 flex items-center justify-center overflow-hidden">
                      {story.photoURL ? (
                        <img src={story.photoURL} alt={story.veteranName || "Veteran photo"} className="object-cover w-full h-full" />
                      ) : (
                        <Icon className="w-14 h-14 text-us-blue" />
                      )}
                    </div>
                    <div className="font-bold text-lg mb-2 text-us-blue">{story.veteranName || "Anonymous Veteran"}</div>
                    <div className="text-sm text-us-blue mb-3">{story.branch} {story.conflict && <>• {story.conflict}</>}</div>
                    <div className="text-us-blue text-sm line-clamp-3">{story.story}</div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-us-blue flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        {formatViewCount(story.viewCount || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Archive() {
  const { user, userRole } = useAuth ? useAuth() : { user: null, userRole: "" };
  const [stories, setStories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [bookmarks, setBookmarks] = useState({});

  useEffect(() => {
    async function fetchStories() {
      setLoading(true);
      try {
        const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const storyList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStories(storyList);
        const countsObj = {};
        await Promise.all(storyList.map(async (story) => {
          const reactionsSnap = await getDocs(collection(db, "stories", story.id, "reactions"));
          let reactionCount = 0;
          reactionsSnap.forEach(doc => { if (doc.data().emoji) reactionCount++; });
          const commentsSnap = await getDocs(collection(db, "stories", story.id, "comments"));
          countsObj[story.id] = {
            reactions: reactionCount,
            comments: commentsSnap.size,
          };
        }));
        setCounts(countsObj);
      } catch (e) {
        setStories([]);
      }
      setLoading(false);
    }
    fetchStories();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        const userId = user.uid;
        const fetchBookmarks = async () => {
          try {
            const q = query(collection(db, "bookmarks"));
            const snap = await getDocs(q);
            const bookmarkList = snap.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(bookmark => bookmark.userId === userId);
            
            const bookmarkObj = {};
            bookmarkList.forEach(bookmark => {
              bookmarkObj[bookmark.storyId] = true;
            });
            setBookmarks(bookmarkObj);
          } catch (error) {
            console.error("Error fetching bookmarks:", error);
            setBookmarks({});
          }
        };
        fetchBookmarks();
      } else {
        // User is signed out
        setBookmarks({});
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filtered = stories.filter(story => {
    const s = search.toLowerCase();
    return (
      story.veteranName?.toLowerCase().includes(s) ||
      story.branch?.toLowerCase().includes(s) ||
      story.conflict?.toLowerCase().includes(s) ||
      story.location?.toLowerCase().includes(s)
    );
  });

  const toggleBookmark = async (storyId, storyData) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to bookmark stories");
      return;
    }

    try {
      const bookmarkRef = doc(db, "bookmarks", `${user.uid}_${storyId}`);
      
      if (bookmarks[storyId]) {
        // Remove bookmark
        await deleteDoc(bookmarkRef);
        setBookmarks(prev => ({ ...prev, [storyId]: false }));
      } else {
        // Add bookmark
        await setDoc(bookmarkRef, {
          userId: user.uid,
          storyId: storyId,
          veteranName: storyData.veteranName,
          branch: storyData.branch,
          conflict: storyData.conflict,
          createdAt: Timestamp.now()
        });
        setBookmarks(prev => ({ ...prev, [storyId]: true }));
      }

      window.dispatchEvent(new Event('bookmarkCountChanged'));
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("Failed to update bookmark");
    }
  };

  const flagStory = async (storyId) => {
    if (!user) return alert("You must be logged in to flag stories.");
    await updateDoc(doc(db, "stories", storyId), { flagged: true });
    alert("Story flagged for moderator review.");
  };

  return (
    <div className="flex-1 w-full bg-us-white text-us-blue">
      {/* Hero Section */}
      <div className="px-6 py-12 bg-us-blue text-us-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-us-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow text-us-white">Veteran Stories Archive</h1>
          <p className="text-xl text-us-white mb-8 max-w-3xl mx-auto">
            Discover and explore the incredible stories of Iowa's veterans. 
            Search through our collection to find stories that inspire and honor.
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="px-6 py-8 bg-us-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              className="w-full px-6 py-4 text-lg border border-us-red rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-us-red focus:border-transparent text-us-blue bg-us-white/80 backdrop-blur-sm"
              type="text"
              placeholder="Search by name, branch, conflict, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-us-red">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-2xl text-us-red mb-4">Loading stories...</div>
              <div className="text-us-blue">Please wait while we fetch the latest veteran stories.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-2xl text-us-red mb-4">No stories found</div>
              <div className="text-us-blue mb-8">
                {search ? `No stories match your search for "${search}".` : "No stories have been submitted yet."}
              </div>
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="bg-us-red text-us-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-us-red mb-2">
                  {search ? `Search Results (${filtered.length})` : `All Stories (${filtered.length})`}
                </h2>
                {search && (
                  <p className="text-us-blue">Showing results for "{search}"</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((story, idx) => {
                  return (
                    <div key={story.id} className="bg-us-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-us-red">
                      <div className="w-full h-48 bg-us-blue flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => window.location.href = `/archive/${story.id}`}>
                        {story.photoURL ? (
                          <img src={story.photoURL} alt={story.veteranName || "Veteran photo"} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <svg className="w-16 h-16 text-us-red" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="font-bold text-lg mb-2 cursor-pointer text-us-red hover:text-us-red transition-colors" onClick={() => window.location.href = `/archive/${story.id}`}>
                          {story.veteranName || <span className="italic text-us-blue">Anonymous Veteran</span>}
                        </div>
                        <div className="text-sm text-us-blue mb-3 cursor-pointer" onClick={() => window.location.href = `/archive/${story.id}`}>
                          {story.branch} {story.conflict && <>• {story.conflict}</>}
                        </div>
                        <div className="text-sm text-us-blue mb-3 cursor-pointer" onClick={() => window.location.href = `/archive/${story.id}`}>
                          {story.years && <>Years: {story.years}</>} {story.location && <>• {story.location}</>}
                        </div>
                        <div className="text-us-blue text-sm mb-4 line-clamp-3 cursor-pointer" onClick={() => window.location.href = `/archive/${story.id}`}>
                          {story.story}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1 text-us-red font-semibold">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                              </svg>
                              {counts[story.id]?.comments ?? 0}
                            </span>
                            <span className="flex items-center gap-1 text-us-red font-semibold">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              {counts[story.id]?.reactions ?? 0}
                            </span>
                            <span className="flex items-center gap-1 text-us-blue">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                              </svg>
                              {formatViewCount(story.viewCount || 0)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(story.id, story);
                              window.dispatchEvent(new Event('bookmarkCountChanged'));
                            }}
                            className="p-2 rounded-lg bg-us-blue text-us-white"
                            title={bookmarks[story.id] ? "Remove bookmark" : "Add bookmark"}
                          >
                            {bookmarks[story.id] ? (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            )}
                          </button>
                            <button
                            className="border border-us-red bg-us-red text-us-white rounded px-2 py-0.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-us-red ml-2"
                              onClick={() => flagStory(story.id)}
                            >
                              <svg className="w-3 h-3 inline mr-1 text-us-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                              </svg>
                              Flag
                            </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Login() {
  return <AuthForm />;
}

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchBookmarks(user.uid);
      } else {
        setBookmarks([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchBookmarks = async (userId) => {
    setLoading(true);
    try {
      const q = query(collection(db, "bookmarks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const bookmarkList = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(bookmark => bookmark.userId === userId);
      
      // Fetch the full story data for each bookmark
      const bookmarksWithStories = await Promise.all(
        bookmarkList.map(async (bookmark) => {
          try {
            const storyDoc = await getDoc(doc(db, "stories", bookmark.storyId));
            if (storyDoc.exists()) {
              return { ...bookmark, storyData: { ...storyDoc.data(), id: storyDoc.id } };
            }
            return null;
          } catch (error) {
            console.error("Error fetching story:", error);
            return null;
          }
        })
      );
      
      setBookmarks(bookmarksWithStories.filter(Boolean));
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      setBookmarks([]);
    }
    setLoading(false);
  };

  const removeBookmark = async (bookmarkId, storyId) => {
    try {
      await deleteDoc(doc(db, "bookmarks", bookmarkId));
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      window.dispatchEvent(new Event('bookmarkCountChanged'));
    } catch (error) {
      console.error("Error removing bookmark:", error);
      alert("Failed to remove bookmark");
    }
  };

  if (!user) {
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
              You must be logged in to view your bookmarks.
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

  return (
    <div className="flex-1 w-full bg-us-white text-us-blue">
      {/* Hero Section */}
      <div className="px-6 py-12 bg-us-blue text-us-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-us-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow text-us-white">My Bookmarks</h1>
          <p className="text-xl text-us-white mb-8 max-w-3xl mx-auto">
            Your saved veteran stories. Quick access to the stories that matter most to you.
          </p>
        </div>
      </div>

      {/* Bookmarks Content */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-2xl text-us-blue mb-4">Loading bookmarks...</div>
              <div className="text-us-blue">Please wait while we fetch your saved stories.</div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <svg className="w-16 h-16 text-us-red" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-us-blue mb-4">No Bookmarks Yet</h2>
              <p className="text-us-blue mb-8 max-w-md mx-auto">
                You haven't bookmarked any stories yet. Visit the Archive to discover and save your favorite veteran stories!
              </p>
              <a 
                href="/archive"
                className="bg-us-red text-us-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Browse Archive
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-us-blue mb-2">
                  Your Saved Stories ({bookmarks.length})
                </h2>
                <p className="text-us-blue">Click on any story to read more.</p>
              </div>
              <div className="max-w-4xl mx-auto">
                {bookmarks.map((bookmark) => {
                  const story = bookmark.storyData;
                  const storyId = story?.id || bookmark.storyId;
                  if (!story || !storyId) return null;

                  return (
                    <div 
                      key={bookmark.id} 
                      className="mb-6 p-5 bg-us-white border-l-4 border-us-red rounded-lg shadow-md hover:shadow-lg transition-shadow relative group"
                    >
                      <div className="flex gap-4">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => window.location.href = `/archive/${storyId}`}
                        >
                          <h3 className="text-xl font-bold text-us-red mb-2">
                            {story.veteranName || "Anonymous Veteran"}
                          </h3>
                          <div className="text-sm text-us-blue mb-2">
                            {story.branch}
                            {story.conflict && <span> • {story.conflict}</span>}
                            {story.years && <span> • {story.years}</span>}
                            {story.location && <span> • {story.location}</span>}
                          </div>
                          <p className="text-us-blue line-clamp-2 mb-3">
                            {story.story}
                          </p>
                        </div>
                        {story.photoURL && (
                          <div 
                            className="w-24 h-24 flex-shrink-0 rounded overflow-hidden cursor-pointer"
                            onClick={() => window.location.href = `/archive/${storyId}`}
                          >
                            <img 
                              src={story.photoURL} 
                              alt={story.veteranName || "Veteran photo"} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmark(bookmark.id, storyId);
                        }}
                        className="absolute top-3 right-3 bg-us-red text-us-white rounded-full p-2 shadow-lg hover:bg-red-700 transition-colors"
                        title="Remove from bookmarks"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Timeline() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredStory, setHoveredStory] = useState(null);

  useEffect(() => {
    async function fetchStories() {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "stories"));
      const validStories = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        let year, yearsEnd;
        if (typeof data.years === "string") {
          // Match patterns like '1944-1946' or '1944–1946'
          const match = data.years.match(/(\d{4})\s*[–-]\s*(\d{4})/);
          if (match) {
            year = parseInt(match[1]);
            yearsEnd = parseInt(match[2]);
          } else {
            // Just a single year
            year = parseInt(data.years);
          }
        } else {
          year = parseInt(data.years);
        }
        if (!isNaN(year) && year >= 1800 && year <= new Date().getFullYear()) {
          validStories.push({ ...data, id: docSnap.id, year, yearsEnd });
        }
      });
      setStories(validStories.sort((a, b) => a.year - b.year));
      setLoading(false);
    }
    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-us-blue text-us-white flex items-center justify-center text-us-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-us-white mx-auto mb-4"></div>
          <div className="text-2xl text-us-white font-semibold">Loading Timeline...</div>
          <div className="text-us-blue">Gathering veteran stories across time</div>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="min-h-screen bg-us-blue text-us-white flex items-center justify-center text-us-white">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16 text-us-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-us-white mb-4">No Stories Found</h2>
          <p className="text-us-blue mb-8 max-w-md mx-auto">
            No stories with valid years found. Stories need to have years between 1800 and present.
          </p>
          <a 
            href="/archive"
            className="bg-us-white text-us-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Browse Archive
          </a>
        </div>
      </div>
    );
  }

  // Timeline scaling
  const minYear = Math.min(...stories.map(s => s.year));
  const maxYear = Math.max(...stories.map(s => s.year));
  const yearRange = maxYear - minYear || 1;

  // Generate year markers for better visualization
  const yearMarkers = [];
  const step = Math.max(1, Math.floor(yearRange / 10));
  for (let year = minYear; year <= maxYear; year += step) {
    yearMarkers.push(year);
  }
  if (yearMarkers[yearMarkers.length - 1] !== maxYear) {
    yearMarkers.push(maxYear);
  }

  return (
    <div className="min-h-screen bg-us-white text-us-blue">
      {/* Header */}
      <div className="bg-us-blue text-us-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-us-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9zM7 10h5v5H7z"/>
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow text-us-white">Veteran Stories Timeline</h1>
          <p className="text-xl text-us-white mb-8 max-w-3xl mx-auto">
            Journey through time and explore the stories of Iowa's veterans from {minYear} to {maxYear}
          </p>
          <div className="bg-us-white/10 backdrop-blur-sm rounded-lg p-4 inline-block">
            <div className="text-sm text-us-white">
              <span className="font-semibold">{stories.length}</span> stories spanning <span className="font-semibold">{yearRange}</span> years
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Timeline stats above the timeline */}
        <div className="flex justify-between items-center mb-6 bg-us-white rounded-lg shadow-lg p-4">
          <div className="text-sm text-us-blue">
            <span className="font-semibold">Timeline spans:</span> {minYear} - {maxYear}
          </div>
          <div className="text-sm text-us-blue">
            <span className="font-semibold">Total stories:</span> {stories.length}
          </div>
        </div>

        <div className="bg-us-white rounded-2xl shadow-2xl p-8">
          <div className="relative" style={{ minHeight: 180 }}>
            {/* Main Timeline Line (thicker and darker) */}
            <div className="absolute left-0 right-0" style={{ top: '60px', height: '6px', background: '#18333A', borderRadius: '3px', zIndex: 0 }} />
            {/* Year markers */}
            {yearMarkers.map((year, index) => {
              const leftPercent = ((year - minYear) / yearRange) * 100;
              return (
                <div
                  key={year}
                  className="absolute z-5 flex flex-col items-center"
                  style={{ left: `${leftPercent}%`, top: '40px', transform: 'translateX(-50%)' }}
                >
                  <div className="w-1.5 h-10 bg-us-blue mb-2" style={{ background: '#18333A', borderRadius: '2px' }}></div>
                  <div className="text-xs font-semibold text-us-blue bg-us-white px-2 py-1 rounded shadow" style={{ color: '#18333A' }}>
                    {year}
                  </div>
                </div>
              );
            })}
            {/* Story markers with vertical stem and improved spacing */}
            {stories.map((story, index) => {
              const leftPercent = ((story.year - minYear) / yearRange) * 100;
              const isHovered = hoveredStory === story.id;
              const isOtherHovered = hoveredStory && hoveredStory !== story.id;
              return (
                <div
                  key={story.id}
                  className={`absolute z-10 flex flex-col items-center group transition-all duration-300 ${isOtherHovered ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                  style={{ left: `${leftPercent}%`, top: '0px', transform: 'translateX(-50%)' }}
                  onMouseEnter={() => setHoveredStory(story.id)}
                  onMouseLeave={() => setHoveredStory(null)}
                >
                  {/* Vertical stem from timeline to marker (thicker and darker) */}
                  <div className="w-1.5 h-10" style={{ background: '#18333A', borderRadius: '2px', marginBottom: '-8px', marginTop: '60px' }}></div>
                  {/* Story marker */}
                  <button
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 ${isHovered ? 'bg-us-red text-us-white shadow-xl scale-110 ring-4 ring-us-red' : 'bg-us-red text-us-white hover:from-us-white hover:to-us-red'}`}
                    title={`${story.veteranName || 'Anonymous Veteran'} (${story.year})`}
                    onClick={() => window.location.href = `/archive/${story.id}`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                  {/* Story name (with more spacing and readable color) */}
                  <div className={`text-xs text-center font-semibold mt-3 max-w-32 transition-all duration-300 ${isHovered ? 'text-us-red font-bold bg-us-white px-2 py-1 rounded shadow-lg z-20' : 'text-us-blue'}`} style={{ color: '#18333A', marginTop: '12px' }}>
                    {story.veteranName || 'Anonymous'}
                    <div className="text-xs font-bold mt-1" style={{ color: '#18333A' }}>
                      {story.year}{story.yearsEnd ? `–${story.yearsEnd}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Analytics>
          <Routes>
            <Route path="/" element={<StyledLanding />} />
            <Route path="/submit" element={<MainLayout><SubmitStory /></MainLayout>} />
            <Route path="/archive" element={<MainLayout><Archive /></MainLayout>} />
            <Route path="/archive/:id" element={<MainLayout><StoryDetail /></MainLayout>} />
            <Route path="/thankyou" element={<MainLayout><ThankYouLetter /></MainLayout>} />
            <Route path="/login" element={<MainLayout><AuthForm /></MainLayout>} />
            <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/educator" element={<MainLayout><Educator /></MainLayout>} />
            <Route path="/veteran" element={<MainLayout><Veteran /></MainLayout>} />
            <Route path="/bookmarks" element={<MainLayout><Bookmarks /></MainLayout>} />
            <Route path="/moderator" element={<MainLayout><Moderator /></MainLayout>} />
            <Route path="/timeline" element={<MainLayout><Timeline /></MainLayout>} />
          </Routes>
        </Analytics>
      </AuthProvider>
    </Router>
  );
}
