import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { doc, getDoc, collection, addDoc, onSnapshot, setDoc, increment, updateDoc, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "./components/AuthContext";

// SVG Icon Components for reactions
const ReactionIcons = {
  // American flag SVG for the first reaction
  "🇺🇸": ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="16" y="4" fill="#fff"/>
      <rect width="24" height="2.29" y="4" fill="#B22234"/>
      <rect width="24" height="2.29" y="8.58" fill="#B22234"/>
      <rect width="24" height="2.29" y="13.16" fill="#B22234"/>
      <rect width="9.6" height="8" x="0" y="4" fill="#3C3B6E"/>
      <g fill="#fff">
        <circle cx="1.5" cy="5.5" r="0.5"/>
        <circle cx="3.5" cy="6.5" r="0.5"/>
        <circle cx="1.5" cy="7.5" r="0.5"/>
        <circle cx="3.5" cy="8.5" r="0.5"/>
        <circle cx="5.5" cy="5.5" r="0.5"/>
        <circle cx="7.5" cy="6.5" r="0.5"/>
        <circle cx="5.5" cy="7.5" r="0.5"/>
        <circle cx="7.5" cy="8.5" r="0.5"/>
      </g>
    </svg>
  ),
  "🙏": ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  "❤️": ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  "⭐️": ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
};

// Medal/Star icon for the Veteran Story header
const VeteranHeaderIcon = ({ className = "w-16 h-16 text-[#2d5a27]" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#eaf7ea"/>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#2d5a27"/>
    <circle cx="12" cy="12" r="3" fill="#FFD700" />
  </svg>
);

// Flag Icon Component
const FlagIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
  </svg>
);

const EMOJIS = ["🇺🇸", "🙏", "❤️", "⭐️"];
const MODERATOR_UID = "VFNN3G45mcaMAFFDmT3IwsZmWgp2"; // Actual moderator UID

export default function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, userRole } = useAuth ? useAuth() : { user: null, userRole: "" };
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState("");
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, setUser);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    async function fetchStory() {
      setLoading(true);
      const ref = doc(db, "stories", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const storyData = { id: snap.id, ...snap.data() };
        setStory(storyData);
        setViewCount(storyData.viewCount || 0);
        
        // Track view only if user hasn't viewed this story before
        if (user) {
          try {
            const viewRef = doc(db, "storyViews", `${storyData.id}_${user.uid}`);
            const viewSnap = await getDoc(viewRef);
            
            if (!viewSnap.exists()) {
              // First time viewing this story
              await setDoc(viewRef, {
                storyId: storyData.id,
                userId: user.uid,
                viewedAt: new Date()
              });
              
              // Increment view count
              await updateDoc(ref, {
                viewCount: increment(1)
              });
              setViewCount(prev => prev + 1);
            }
          } catch (error) {
            console.error("Error tracking view:", error);
          }
        }
      } else {
        setStory(null);
      }
      setLoading(false);
    }
    fetchStory();
    
    // Listen for reactions
    const unsubReactions = onSnapshot(collection(db, "stories", id, "reactions"), snap => {
      const data = {};
      snap.forEach(doc => {
        const { emoji, userId } = doc.data();
        if (emoji) {
          data[emoji] = (data[emoji] || 0) + 1;
          if (user && user.uid === userId) setUserReaction(emoji);
        }
      });
      setReactions(data);
    });
    
    // Listen for comments
    const unsubComments = onSnapshot(collection(db, "stories", id, "comments"), snap => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => {
      unsubReactions();
      unsubComments();
    };
  }, [id, user]);

  const handleReact = async (emoji) => {
    if (!user) return alert("You must be logged in to react.");
    // Only one reaction per user per story
    const ref = doc(db, "stories", id, "reactions", user.uid);
    await setDoc(ref, { emoji, userId: user.uid });
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to comment.");
    if (!comment.trim()) return;
    setCommentLoading(true);
    await addDoc(collection(db, "stories", id, "comments"), {
      text: comment,
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      createdAt: new Date(),
    });
    setComment("");
    setCommentLoading(false);
  };

  const formatViewCount = (count) => {
    if (count === 0) return "No views yet";
    if (count === 1) return "1 person has read this story";
    return `${count} people have read this story`;
  };

  const flagStory = async () => {
    await updateDoc(doc(db, "stories", id), { flagged: true });
    alert("Story flagged for moderator review.");
  };

  const flagComment = async (commentId) => {
    await updateDoc(doc(db, "stories", id, "comments", commentId), { flagged: true });
    alert("Comment flagged for moderator review.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!story) return <div className="min-h-screen flex items-center justify-center">Story not found.</div>;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#f6fcf6] to-[#eaf7ea] text-[#2d5a27] py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-4">
            <VeteranHeaderIcon />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow">Veteran Story</h1>
          <p className="text-xl text-green-900 mb-8 max-w-3xl mx-auto">
            Read the full story of this Iowa veteran.
          </p>
        </div>
      </div>
      {/* Story Content */}
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-green-100">
          <button onClick={() => navigate(-1)} className="mb-4 text-[#2d5a27] flex items-center gap-2 hover:underline">
            <span className="text-2xl">←</span> Back
          </button>
          <div className="flex flex-col items-center gap-4">
            {story.photoURL && (
              <div className="w-full max-h-80 bg-white flex items-center justify-center rounded">
                <img src={story.photoURL} alt={story.veteranName} className="w-full max-h-80 object-contain rounded" />
              </div>
            )}
            <h2 className="text-3xl font-bold text-[#2d5a27]">{story.veteranName}</h2>
            <div className="text-gray-700">{story.branch} {story.conflict && <>| {story.conflict}</>} {story.years && <>| Years: {story.years}</>} {story.location && <>| {story.location}</>}</div>
            
            {/* View Count Display */}
            <div className="text-sm text-gray-500 bg-[#eaf7ea] px-3 py-1 rounded-full">
              👁️ {formatViewCount(viewCount)}
            </div>
            
            <div className="text-gray-800 text-lg whitespace-pre-line">{story.story}</div>
            <div className="flex gap-4 items-center mt-4">
              {EMOJIS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleReact(emoji)} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors relative ${
                    userReaction === emoji 
                      ? 'bg-[#eaf7ea] text-[#2d5a27] border-2 border-[#2d5a27]' 
                      : 'bg-gray-100 text-gray-600 hover:bg-[#eaf7ea] hover:text-[#2d5a27]'
                  }`}
                  title={emoji === "🇺🇸" ? "Flag" : emoji === "🙏" ? "Prayer" : emoji === "❤️" ? "Love" : "Star"}
                >
                  {ReactionIcons[emoji]({ className: "w-5 h-5" })}
                  <span className="text-sm font-medium">
                    {emoji === "🇺🇸" ? "Flag" : emoji === "🙏" ? "Prayer" : emoji === "❤️" ? "Love" : "Star"}
                  </span>
                  <span className="absolute -top-2 -right-2 bg-[#2d5a27] text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
                    {reactions[emoji] || 0}
                  </span>
                </button>
              ))}
            </div>
            {user && (
              <button 
                className="flex items-center gap-2 border border-red-500 text-red-600 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 ml-2" 
                onClick={flagStory}
                title="Flag story for moderator review"
              >
                <FlagIcon className="w-4 h-4" />
                Flag
              </button>
            )}
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2 text-[#2d5a27]">Comments</h3>
            <form onSubmit={handleComment} className="flex gap-2 mb-4">
              <input type="text" className="flex-1 border rounded px-3 py-2 bg-[#eaf7ea] text-[#2d5a27] placeholder-gray-400" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} disabled={!user} />
              <button type="submit" className="bg-[#2d5a27] text-white px-4 py-2 rounded" disabled={!user || commentLoading}>{commentLoading ? "Posting..." : "Post"}</button>
            </form>
            <div className="space-y-2">
              {comments.length === 0 && <div className="text-gray-500">No comments yet.</div>}
              {comments.map(c => (
                <div key={c.id} className="bg-gray-100 rounded p-2">
                  <div className="font-semibold text-sm">{c.userName || "Anonymous"}</div>
                  <div className="text-gray-800 text-base">{c.text}</div>
                  {user && (
                    <button 
                      className="flex items-center gap-2 border border-red-500 text-red-600 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 ml-2" 
                      onClick={() => flagComment(c.id)}
                      title="Flag comment for moderator review"
                    >
                      <FlagIcon className="w-4 h-4" />
                      Flag
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 