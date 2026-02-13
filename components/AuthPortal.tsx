
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { saveProfile, getProfile } from '../services/storageService';

interface AuthPortalProps {
  onAuthenticated: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase!.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data?.user) {
          const defaultProfile = getProfile();
          // Fixed: saveProfile is synchronous in storageService
          saveProfile({ ...defaultProfile, name: email.split('@')[0] });
        }
      } else {
        const { error: signInError } = await supabase!.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      // Fixed: Removed call to non-existent pullFromSupabase
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || 'Authorization link failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-space-1000 flex items-center justify-center p-6">
      <div className="starfield opacity-50"></div>
      
      {/* Intense Background Scanning */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[600px] h-[600px] border-2 border-neon-cyan rounded-full animate-ping"></div>
          <div className="absolute w-[900px] h-[900px] border-2 border-neon-pink rounded-full animate-radar-sweep"></div>
      </div>
      
      <div className="max-w-md w-full glass-card p-10 md:p-14 rounded-[3rem] text-center relative overflow-hidden flex flex-col items-center gap-10 shadow-2xl border-neon-cyan/50 tactical-bracket">
        <div className="neon-scanline"></div>
        <div className="space-y-4">
          <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-neon-cyan/10 border-4 border-neon-cyan flex items-center justify-center text-neon-cyan text-4xl md:text-6xl mx-auto shadow-[0_0_30px_rgba(0,255,255,0.4)] relative z-10">
                <i className={`fas ${loading ? 'fa-circle-notch fa-spin' : 'fa-id-badge'} transition-transform duration-500`}></i>
              </div>
              <div className="absolute -inset-6 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse"></div>
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter neon-text-cyan">
            {isSignUp ? 'New Link' : 'Secure Access'}
          </h2>
          <p className="text-[10px] md:text-xs text-neon-pink font-black uppercase tracking-[0.5em] font-mono italic">
            {loading ? 'ENCRYPTING_NEURAL_STREAMS...' : 'BIOMETRIC_CHECK_V10'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="w-full space-y-6 relative z-10">
          <div className="space-y-4">
            <div className="relative">
                <i className="fas fa-terminal absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan text-xs"></i>
                <input 
                  type="email" 
                  placeholder="IDENTITY_EMAIL" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/80 border-2 border-neon-cyan/40 rounded-2xl px-12 py-5 text-white font-mono text-sm focus:border-neon-cyan outline-none transition-all shadow-[inset_0_0_10px_rgba(0,0,0,1)] placeholder-slate-700"
                  required
                />
            </div>
            <div className="relative">
                <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-neon-pink text-xs"></i>
                <input 
                  type="password" 
                  placeholder="PASSCODE" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/80 border-2 border-neon-pink/40 rounded-2xl px-12 py-5 text-white font-mono text-sm focus:border-neon-pink outline-none transition-all shadow-[inset_0_0_10px_rgba(0,0,0,1)] placeholder-slate-700"
                  required
                />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-neon-red/10 border-2 border-neon-red rounded-xl animate-fade-in">
                <p className="text-neon-red text-[11px] font-black font-mono uppercase tracking-widest">
                   <i className="fas fa-exclamation-triangle mr-2"></i>
                   {error}
                </p>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-neon-cyan text-black font-black uppercase text-sm md:text-base tracking-[0.6em] rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.4)] active:scale-95 transition-all italic font-mono border-b-4 border-neon-blue"
          >
            {loading ? 'SYNCHRONIZING...' : isSignUp ? 'INITIALIZE_ID' : 'AUTHORIZE_LINK'}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-[10px] md:text-[12px] font-black text-white/40 hover:text-neon-cyan transition-colors uppercase tracking-[0.4em] font-mono italic"
        >
          {isSignUp ? 'Verified? Secure Login' : 'New Sector? Register'}
        </button>
      </div>
    </div>
  );
};
