import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const roles = [
  { value: "STUDENT", label: "Student" },
  { value: "VETERAN", label: "Veteran" },
  { value: "EDUCATOR", label: "Educator" },
];

export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(roles[0].value);
  const [error, setError] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState(null);
  const [justRegistered, setJustRegistered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        setProfile(snap.exists() ? snap.data() : null);
        if (justRegistered) {
          setJustRegistered(false);
          navigate("/");
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsub();
  }, [justRegistered, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name,
          email,
          role,
        });
        setJustRegistered(true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name: user.displayName || "",
          email: user.email,
          role: "STUDENT",
        });
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (user && profile) {
    return (
      <div className="flex-1 w-full bg-white text-black">
        <div className="px-6 py-12 bg-gradient-to-br from-[#f6fcf6] to-[#eaf7ea] text-[#2d5a27]">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <svg className="w-16 h-16 text-[#2d5a27]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
            <div className="bg-white rounded-xl p-6 max-w-md mx-auto border border-green-100">
              <div className="mb-4">Logged in as <span className="font-bold text-green-900">{profile.name || user.email}</span></div>
              <div className="mb-4">Role: <span className="font-semibold text-green-900">{profile.role}</span></div>
              <div className="mb-6">Email: {user.email}</div>
              <button onClick={handleLogout} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition">Logout</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          background: rgba(255, 255, 255, 0.3);
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

        .auth-container {
          position: relative;
          z-index: 2;
        }
      `}</style>

      {/* Mouse animation particles */}
      <div className="particles" id="particles"></div>

      <div className="auth-container flex-1 w-full bg-white text-black">
        {/* Hero Section */}
        <div className="px-6 py-12 bg-gradient-to-br from-[#f6fcf6] to-[#eaf7ea] text-[#2d5a27]">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-[#2d5a27]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow">
              {isRegister ? "Join IAHeroes" : "Welcome Back"}
            </h1>
            <p className="text-xl text-green-900 mb-8 max-w-3xl mx-auto">
              {isRegister 
                ? "Create an account to submit stories, send thank you letters, and connect with Iowa's veterans."
                : "Sign in to access your account and continue preserving the stories of Iowa's heroes."
              }
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-6 py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  {isRegister ? "Create Account" : "Sign In"}
                </h2>
                <p className="text-gray-600">
                  {isRegister ? "Join our community of storytellers" : "Welcome back to IAHeroes"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </div>
                        <select
                          value={role}
                          onChange={e => setRole(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent appearance-none bg-white"
                          required
                        >
                          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition font-semibold"
                >
                  {isRegister ? "Create Account" : "Sign In"}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <g>
                      <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.19C12.13 13.16 17.57 9.5 24 9.5z"/>
                      <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.39c-.53 2.85-2.13 5.26-4.54 6.89l7.02 5.46C43.93 36.13 46.1 30.8 46.1 24.55z"/>
                      <path fill="#FBBC05" d="M9.67 28.28c-1.13-3.36-1.13-6.97 0-10.33l-7.98-6.19C-1.13 17.13-1.13 30.87 1.69 39.91l7.98-6.19z"/>
                      <path fill="#EA4335" d="M24 48c6.48 0 11.92-2.13 15.89-5.81l-7.02-5.46c-1.95 1.31-4.45 2.09-7.17 2.09-6.43 0-11.87-3.66-14.33-8.98l-7.98 6.19C6.71 42.18 14.82 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </g>
                  </svg>
                  Sign in with Google
                </button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    className="text-green-700 hover:text-green-800 underline text-sm font-medium transition"
                    onClick={() => setIsRegister(r => !r)}
                  >
                    {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 