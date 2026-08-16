import React, { useState } from 'react';
import { Package, X, ArrowRight, Sparkles, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle, signInWithDemo } from '../firebase';

export default function PrototypeLandingView({ onCompleteSignUp }: { onCompleteSignUp: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      onCompleteSignUp();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-950 flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-500/20 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Navbar */}
      <header className="px-6 py-6 flex items-center justify-between relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center rotate-3">
            <Package className="w-6 h-6 text-zinc-950" />
          </div>
          <span className="font-bold text-2xl tracking-tight">Capsule</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={signInWithGoogle}
            className="text-zinc-400 hover:text-zinc-100 font-medium transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-zinc-100 text-zinc-950 px-5 py-2.5 rounded-full font-bold hover:bg-white transition-all active:scale-95"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 max-w-4xl mx-auto w-full pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4 text-zinc-300" />
          <span>The Anti-Backlog</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]"
        >
          Celebrate your <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">gaming journey.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed"
        >
          Stop treating your games like a chore list. Capsule is a digital trophy room and private workshop for the games that matter to you.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button 
            onClick={() => setShowModal(true)}
            className="bg-zinc-100 text-zinc-950 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </main>

      {/* Sign Up Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {step === 1 ? 'Create Account' : 'Claim your identity'}
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      {step === 1 ? 'Join the next generation of gaming journals.' : 'What should we call you?'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 text-zinc-500 hover:text-zinc-100 bg-zinc-950 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSignUp} className="space-y-5">
                  {step === 1 ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email Address</label>
                        <input 
                          type="email" 
                          required
                          placeholder="you@example.com"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Password</label>
                        <input 
                          type="password" 
                          required
                          placeholder="••••••••"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-500 transition-colors"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Username</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">@</span>
                          <input 
                            type="text" 
                            required
                            placeholder="username"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-zinc-500 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-zinc-100 text-zinc-950 py-3.5 rounded-xl font-bold mt-4 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {step === 1 ? 'Continue' : 'Complete Sign Up'}
                    {step === 1 && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                {step === 1 && (
                  <div className="mt-6 pt-6 border-t border-zinc-800 flex gap-3">
                    <button 
                      onClick={signInWithGoogle}
                      className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 py-3.5 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                      Google
                    </button>
                    <button 
                      onClick={signInWithDemo}
                      className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 py-3.5 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Terminal className="w-4 h-4" />
                      Demo
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
