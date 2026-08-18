import React, { useState } from 'react';
import { X, Send, MessageSquarePlus, Bug, Lightbulb, MessageCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  currentView: string;
  activeGameId: string | null;
}

export function FeedbackModal({ isOpen, onClose, user, currentView, activeGameId }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit feedback');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        uid: user.uid,
        userEmail: user.email || 'unknown',
        displayName: user.displayName || 'unknown',
        type: feedbackType,
        description: description.trim(),
        context: {
          view: currentView,
          gameId: activeGameId,
          url: window.location.href,
          userAgent: navigator.userAgent
        },
        status: 'new',
        createdAt: serverTimestamp()
      });

      toast.success('Feedback submitted successfully! Thank you.');
      setDescription('');
      setFeedbackType('general');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400', bgColor: 'bg-red-400/10', border: 'border-red-400/20' },
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-400', bgColor: 'bg-amber-400/10', border: 'border-amber-400/20' },
    { id: 'general', label: 'General Feedback', icon: MessageCircle, color: 'text-blue-400', bgColor: 'bg-blue-400/10', border: 'border-blue-400/20' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50 shadow-inner">
              <MessageSquarePlus className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Send Feedback</h2>
              <p className="text-xs text-zinc-400">Help us improve the experience</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          {/* Type Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">What kind of feedback?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {typeOptions.map(option => {
                const Icon = option.icon;
                const isSelected = feedbackType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFeedbackType(option.id as any)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      isSelected 
                        ? `${option.bgColor} ${option.border} ring-1 ring-inset ring-${option.color.split('-')[1]}-400/50` 
                        : 'bg-zinc-950 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? option.color : 'text-zinc-500'}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context Info */}
          <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Context</span>
            <span className="text-xs text-zinc-400 truncate">Page: {currentView}</span>
            {activeGameId && <span className="text-xs text-zinc-400 truncate">Game ID: {activeGameId}</span>}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe your feedback in detail... What were you trying to do? What happened instead? Any ideas for improvement?"
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 resize-none transition-all"
              required
            />
          </div>

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5 active:scale-95"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Submit Feedback</span>
          </button>
        </div>

      </div>
    </div>
  );
}
