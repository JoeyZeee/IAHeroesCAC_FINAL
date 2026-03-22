import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { doc, getDoc, collection, addDoc, onSnapshot, setDoc, increment, updateDoc, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "./components/AuthContext";
import { FaEye, FaFlag, FaPrayingHands, FaHeart, FaStar } from 'react-icons/fa';

// SVG/Icon Components for reactions
const ReactionIcons = {
  flag: ({ className = "w-6 h-6" }) => <FaFlag className={className} />,
  prayer: ({ className = "w-6 h-6" }) => <FaPrayingHands className={className} />,
  love: ({ className = "w-6 h-6" }) => <FaHeart className={className} />,
  star: ({ className = "w-6 h-6" }) => <FaStar className={className} />,
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

const REACTIONS = ["flag", "prayer", "love", "star"];
const reactionLabels = { flag: "Flag", prayer: "Prayer", love: "Love", star: "Star" };
const legacyReactionMappings = {
  "\u{1F1FA}\u{1F1F8}": "flag",
  "\u{1F64F}": "prayer",
  "\u{2764}\u{FE0F}": "love",
  "\u{2B50}\u{FE0F}": "star"
};
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
        if (!emoji) return;
        const normalized = legacyReactionMappings[emoji] || emoji;
        data[normalized] = (data[normalized] || 0) + 1;
        if (user && user.uid === userId) setUserReaction(normalized);
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

  const goBack = () => {
    navigate("/archive");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!story) return <div className="min-h-screen flex items-center justify-center">Story not found.</div>;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="bg-us-blue text-us-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-4">
            {/* Use a blue/red/white star icon here if desired */}
            <svg className="w-16 h-16 text-us-red" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow">Veteran Story</h1>
          <p className="text-xl text-us-white mb-8 max-w-3xl mx-auto">
            Read the full story of this Iowa veteran.
          </p>
        </div>
      </div>
      {/* Story Content */}
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-us-blue">
          <button onClick={goBack} className="mb-4 text-us-white flex items-center gap-2 bg-us-red px-4 py-2 rounded-lg">
            <span className="text-2xl">←</span> Back
          </button>
          <div className="flex flex-col items-center gap-4">
            {story.photoURL && (
              <div className="w-full max-h-80 bg-white flex items-center justify-center rounded">
                <img src={story.photoURL} alt={story.veteranName} className="w-full max-h-80 object-contain rounded" />
              </div>
            )}
            <h2 className="text-3xl font-bold text-us-blue">{story.veteranName}</h2>
            <div className="text-us-blue">{story.branch} {story.conflict && <>| {story.conflict}</>} {story.years && <>| Years: {story.years}</>} {story.location && <>| {story.location}</>}</div>
            
            {/* View Count Display */}
            <div className="text-sm text-us-blue bg-us-white px-3 py-1 rounded-full border border-us-blue flex items-center gap-1">
              <FaEye className="w-4 h-4" /> {formatViewCount(viewCount)}
            </div>
            
            <div className="text-black text-lg whitespace-pre-line">{story.story}</div>
            <div className="flex gap-4 items-center mt-4">
              {REACTIONS.map(reaction => (
                <button 
                  key={reaction} 
                  onClick={() => handleReact(reaction)} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors relative ${
                    userReaction === reaction 
                      ? 'bg-us-blue text-us-white border-2 border-us-blue' 
                      : 'bg-us-white text-us-blue border border-us-blue'
                  }`}
                  title={reactionLabels[reaction]}
                >
                  {ReactionIcons[reaction]({ className: "w-5 h-5" })}
                  <span className="text-sm font-medium">{reactionLabels[reaction]}</span>
                  <span className="absolute -top-2 -right-2 bg-us-blue text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
                    {reactions[reaction] || 0}
                  </span>
                </button>
              ))}
            </div>
            {user && (
              <button 
                className="flex items-center gap-2 border border-red-500 bg-us-red text-us-white rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 ml-2" 
                onClick={flagStory}
                title="Flag story for moderator review"
              >
                <FlagIcon className="w-4 h-4 text-us-white" />
                Flag
              </button>
            )}
          </div>
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-us-blue mb-4">Comments</h3>
            <form onSubmit={handleComment} className="flex gap-2 items-center mb-6">
              <input
                type="text"
                className="flex-1 px-4 py-3 border border-us-blue rounded-xl bg-us-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue"
                placeholder="Add a comment..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                disabled={commentLoading}
              />
              <button
                type="submit"
                disabled={commentLoading || !comment.trim()}
                className="bg-us-blue text-us-white font-semibold px-6 py-2 rounded-lg transition"
              >
                Post
              </button>
            </form>
            <div className="space-y-2">
              {comments.length === 0 && <div className="text-gray-500">No comments yet.</div>}
              {comments.map(c => (
                <div key={c.id} className="bg-us-white rounded p-2 border border-us-blue">
                  <div className="font-semibold text-sm text-us-blue">{c.userName || "Anonymous"}</div>
                  <div className="text-black text-base">{c.text}</div>
                  {user && (
                    <button 
                      className="flex items-center gap-2 border border-us-red bg-us-red text-us-white rounded px-3 py-2 text-sm font-semibold ml-2"
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
