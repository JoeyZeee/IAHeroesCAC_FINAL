import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, query } from "firebase/firestore";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth.currentUser);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
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
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <>
      <nav className="bg-white rounded-3xl shadow-md mx-auto my-6 max-w-screen-lg px-8 py-2 relative z-[100] flex items-center justify-between">
        <Link to="/" className="text-us-blue font-bold text-xl no-underline hover:no-underline hover:text-us-blue">
          IAHeroes
        </Link>

        <div className="flex-1 flex justify-center">
          <div className="flex gap-6 items-center">
            <Link to="/" className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue">
              Home
            </Link>
            <Link to="/submit" className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue">
              Submit Story
            </Link>
            <Link to="/archive" className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue">
              Archive
            </Link>
            <Link to="/timeline" className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue">
              Timeline
            </Link>
            <Link to="/thankyou" className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue">
              Thank You Letter
            </Link>
            <Link to="/bookmarks" className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue">
              Bookmarks{bookmarkCount > 0 && ` (${bookmarkCount})`}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue bg-transparent border-none cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-us-blue font-medium text-base no-underline hover:no-underline hover:text-us-blue">
              Login
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
