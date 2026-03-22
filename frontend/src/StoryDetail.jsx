import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { doc, getDoc, collection, addDoc, onSnapshot, setDoc, increment, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "./components/AuthContext";
import { FaEye, FaPrayingHands, FaHeart, FaThumbsUp } from 'react-icons/fa';

// Three reactions: Prayer, Love, Thumbs Up
const REACTION_IDS = ["prayer", "love", "thumbs"];

const LEGACY_REACTION_TO_ID = Object.fromEntries([
  ["\u{1F1FA}\u{1F1F8}", "prayer"],
  ["\u{1F64F}", "prayer"],
  ["\u{2764}\u{FE0F}", "love"],
  ["\u{2764}", "love"],
  ["\u{2B50}\u{FE0F}", "thumbs"],
  ["\u{2B50}", "thumbs"],
  ["\u{1F44D}", "thumbs"],
]);

function normalizeReactionId(raw) {
  if (!raw) return "";
  if (raw === "flag") return "prayer";
  if (raw === "star") return "thumbs";
  if (REACTION_IDS.includes(raw)) return raw;
  return LEGACY_REACTION_TO_ID[raw] || "";
}

const ReactionIcons = {
  prayer: ({ className = "w-6 h-6" }) => <FaPrayingHands className={className} />,
  love:   ({ className = "w-6 h-6" }) => <FaHeart className={className} />,
  thumbs: ({ className = "w-6 h-6" }) => <FaThumbsUp className={className} />,
};

const reactionLabels = { prayer: "Prayer", love: "Love", thumbs: "Thumbs Up" };

const FlagIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
  </svg>
);

const MODERATOR_UID = "VFNN3G45mcaMAFFDmT3IwsZmWgp2";

function ReactionBar({ counts, userReactionId, onReact, compact }) {
  return (
    <div className={compact ? "flex flex-wrap gap-2 items-center mt-2" : "flex gap-4 items-center mt-4"}>
      {REACTION_IDS.map((rid) => {
        const selected = userReactionId === rid;
        const count = counts[rid] ?? 0;
        return (
          <button
            key={rid}
            type="button"
            onClick={() => onReact(rid)}
            title={reactionLabels[rid]}
            className={`relative flex items-center gap-2 rounded-lg border transition-colors ${
              compact ? "px-2 py-1.5" : "px-3 py-2"
            } ${
              selected
                ? "bg-us-blue text-us-white border-us-blue"
                : "bg-us-white text-us-blue border-us-blue"
            }`}
          >
            {ReactionIcons[rid]({ className: compact ? "w-4 h-4" : "w-5 h-5" })}
            <span className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
              {reactionLabels[rid]}
            </span>
            <span className="absolute -top-2 -right-2 bg-us-blue text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function commentTime(c) {
  const t = c.createdAt?.toDate?.() ?? c.createdAt;
  if (!t) return null;
  try { return t.toLocaleString?.() ?? null; } catch { return null; }
}

export default function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, userRole } = useAuth ? useAuth() : { user: null, userRole: "" };
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState({});
  const [userReactionId, setUserReactionId] = useState("");
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [viewCount, setViewCount] = useState(0);
  const [commentReactionState, setCommentReactionState] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const commentIdsKey = useMemo(() => [...comments.map((c) => c.id)].sort().join(","), [comments]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, setUser);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    setUserReactionId("");
    setCommentReactionState({});
    setReplyingTo(null);
    setReplyText("");
  }, [id]);

  useEffect(() => {
    async function fetchStory() {
      setLoading(true);
      const ref = doc(db, "stories", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const storyData = { id: snap.id, ...snap.data() };
        setStory(storyData);
        setViewCount(storyData.viewCount || 0);
        if (user) {
          try {
            const viewRef = doc(db, "storyViews", `${storyData.id}_${user.uid}`);
            const viewSnap = await getDoc(viewRef);
            if (!viewSnap.exists()) {
              await setDoc(viewRef, { storyId: storyData.id, userId: user.uid, viewedAt: new Date() });
              await updateDoc(ref, { viewCount: increment(1) });
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

    const unsubReactions = onSnapshot(collection(db, "stories", id, "reactions"), (snap) => {
      const data = {};
      let myReactionId = "";
      snap.forEach((d) => {
        const { emoji, userId } = d.data();
        const rid = normalizeReactionId(emoji);
        if (rid) {
          data[rid] = (data[rid] || 0) + 1;
          if (user && user.uid === userId) myReactionId = rid;
        }
      });
      setReactions(data);
      setUserReactionId(user ? myReactionId : "");
    });

    const unsubComments = onSnapshot(collection(db, "stories", id, "comments"), (snap) => {
      setComments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubReactions(); unsubComments(); };
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    if (!commentIdsKey) { setCommentReactionState({}); return; }
    const ids = commentIdsKey.split(",");
    const unsubs = ids.map((commentId) =>
      onSnapshot(collection(db, "stories", id, "comments", commentId, "reactions"), (snap) => {
        const counts = {};
        let myReactionId = "";
        snap.forEach((d) => {
          const { emoji, userId } = d.data();
          const rid = normalizeReactionId(emoji);
          if (rid) {
            counts[rid] = (counts[rid] || 0) + 1;
            if (user && user.uid === userId) myReactionId = rid;
          }
        });
        setCommentReactionState((prev) => ({
          ...prev,
          [commentId]: { counts, userReactionId: user ? myReactionId : "" },
        }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [id, commentIdsKey, user]);

  const handleReact = async (reactionId) => {
    if (!user) return alert("You must be logged in to react.");
    const ref = doc(db, "stories", id, "reactions", user.uid);
    await setDoc(ref, { emoji: reactionId, userId: user.uid });
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

  const handleCommentReact = async (commentId, reactionId) => {
    if (!user) return alert("You must be logged in to react.");
    const ref = doc(db, "stories", id, "comments", commentId, "reactions", user.uid);
    await setDoc(ref, { emoji: reactionId, userId: user.uid });
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to comment.");
    if (!replyingTo || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      await addDoc(collection(db, "stories", id, "comments"), {
        text: replyText.trim(),
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        createdAt: new Date(),
        parentId: replyingTo,
      });
      setReplyText("");
      setReplyingTo(null);
    } finally {
      setReplyLoading(false);
    }
  };

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const ta = a.createdAt?.toDate?.()?.getTime?.() ?? (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const tb = b.createdAt?.toDate?.()?.getTime?.() ?? (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return ta - tb;
    });
  }, [comments]);

  const repliesByParent = useMemo(() => {
    const m = {};
    sortedComments.forEach((c) => {
      if (c.parentId) {
        if (!m[c.parentId]) m[c.parentId] = [];
        m[c.parentId].push(c);
      }
    });
    return m;
  }, [sortedComments]);

  const topLevelComments = useMemo(() => sortedComments.filter((c) => !c.parentId), [sortedComments]);

  const flagStory = async () => {
    await updateDoc(doc(db, "stories", id), { flagged: true });
    alert("Story flagged for moderator review.");
  };

  const flagComment = async (commentId) => {
    await updateDoc(doc(db, "stories", id, "comments", commentId), { flagged: true });
    alert("Comment flagged for moderator review.");
  };

  const deleteCommentWithReplies = async (commentId) => {
    const childIds = (repliesByParent[commentId] || []).map(r => r.id);
    await Promise.all(childIds.map(childId =>
      deleteDoc(doc(db, "stories", id, "comments", childId))
    ));
    await deleteDoc(doc(db, "stories", id, "comments", commentId));
  };

  const formatViewCount = (count) => {
    if (count === 0) return "No views yet";
    if (count === 1) return "1 person has read this story";
    return `${count} people have read this story`;
  };

  const renderCommentThread = (c) => {
    const replies = repliesByParent[c.id] || [];
    const rc = commentReactionState[c.id] || { counts: {}, userReactionId: "" };
    const timeStr = commentTime(c);
    return (
      <div key={c.id}>
        <div className="bg-us-white rounded p-2 border border-us-blue">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-semibold text-sm text-us-blue">{c.userName || "Anonymous"}</span>
            {timeStr && <span className="text-xs text-gray-500">{timeStr}</span>}
          </div>
          <div className="text-black text-base mt-1 whitespace-pre-wrap">{c.text}</div>
          <ReactionBar
            compact
            counts={rc.counts}
            userReactionId={rc.userReactionId}
            onReact={(reactionId) => handleCommentReact(c.id, reactionId)}
          />
          {user && (
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-semibold bg-us-blue text-us-white rounded px-3 py-1"
                onClick={() => {
                  setReplyingTo((prev) => (prev === c.id ? null : c.id));
                  setReplyText("");
                }}
              >
                {replyingTo === c.id ? "Cancel" : "Reply"}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 border border-us-red bg-us-red text-us-white rounded px-3 py-1 text-xs font-semibold"
                  onClick={() => flagComment(c.id)}
                  title="Flag comment for moderator review"
                >
                  <FlagIcon className="w-3 h-3" />
                  Flag
                </button>
              </div>
            </div>
          )}
          {replyingTo === c.id && user && (
            <form onSubmit={handleReplySubmit} className="mt-3 flex flex-col gap-2">
              <input
                type="text"
                className="w-full px-3 py-2 border border-us-blue rounded-lg bg-us-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-us-blue focus:border-us-blue text-sm"
                placeholder={`Reply to ${c.userName || "Anonymous"}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={replyLoading}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={replyLoading || !replyText.trim()}
                  className="bg-us-blue text-us-white font-semibold px-4 py-1.5 rounded-lg text-sm transition"
                >
                  Post reply
                </button>
                <button
                  type="button"
                  className="text-sm font-semibold bg-us-blue text-us-white rounded px-3 py-1"
                  onClick={() => { setReplyingTo(null); setReplyText(""); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        {replies.length > 0 && (
          <div className="ml-4 pl-3 border-l border-us-blue/40 space-y-2 mt-2">
            {replies.map((r) => renderCommentThread(r))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!story) return <div className="min-h-screen flex items-center justify-center">Story not found.</div>;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="bg-us-blue text-us-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-4">
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
          <button onClick={() => navigate(-1)} className="mb-4 text-us-white flex items-center gap-2 bg-us-red px-4 py-2 rounded-lg">
            <span className="text-2xl">←</span> Back
          </button>
          <div className="flex flex-col items-center gap-4">
            {story.photoURL && (
              <div className="w-full max-h-80 bg-white flex items-center justify-center rounded">
                <img src={story.photoURL} alt={story.veteranName} className="w-full max-h-80 object-contain rounded" />
              </div>
            )}
            <h2 className="text-3xl font-bold text-us-blue">{story.veteranName}</h2>
            <div className="text-us-blue">
              {story.branch}
              {story.conflict && <> | {story.conflict}</>}
              {story.years && <> | Years: {story.years}</>}
              {story.location && <> | {story.location}</>}
            </div>

            {/* View Count */}
            <div className="text-sm text-us-blue bg-us-white px-3 py-1 rounded-full border border-us-blue flex items-center gap-1">
              <FaEye className="w-4 h-4" /> {formatViewCount(viewCount)}
            </div>

            <div className="text-black text-lg whitespace-pre-line w-full text-center">{story.story}</div>

            {/* Story Reactions */}
            <ReactionBar
              counts={reactions}
              userReactionId={userReactionId}
              onReact={handleReact}
            />

            {/* Flag Story */}
            {user && (
              <button
                className="flex items-center gap-2 border border-red-500 bg-us-red text-us-white rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={flagStory}
                title="Flag story for moderator review"
              >
                <FlagIcon className="w-4 h-4 text-us-white" />
                Flag
              </button>
            )}
          </div>

          {/* Comments */}
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
            <div className="space-y-4">
              {comments.length === 0 && <div className="text-gray-500">No comments yet.</div>}
              {topLevelComments.map((c) => renderCommentThread(c))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
