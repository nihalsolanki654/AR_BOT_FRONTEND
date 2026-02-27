import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IndianRupee,
    User,
    Lock,
    ArrowRight,
    ShieldCheck,
    Sparkles,
    Globe,
    Zap,
    Fingerprint
} from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/members/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('Connection error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-[#020617] font-sans selection:bg-blue-500/30 selection:text-white">

            {/* dynamic Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* animated Gradients */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse transition-transform duration-[10s]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse transition-transform duration-[10s]" style={{ animationDelay: '2s' }}></div>

                {/* Floating Finance Icons for Depth */}
                <div className="absolute top-[15%] left-[10%] opacity-10 animate-bounce transition-all duration-[5s]" style={{ animationDuration: '4s' }}>
                    <IndianRupee size={48} className="text-white rotate-12" />
                </div>
                <div className="absolute bottom-[20%] right-[15%] opacity-10 animate-bounce transition-all duration-[6s]" style={{ animationDuration: '6s', animationDelay: '1s' }}>
                    <Zap size={40} className="text-blue-400 -rotate-12" />
                </div>
                <div className="absolute top-[60%] left-[20%] opacity-5 animate-pulse">
                    <Globe size={60} className="text-indigo-300" />
                </div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
                </div>
            </div>

            {/* Content Container */}
            <div className={`relative z-10 w-full max-w-[420px] transition-all duration-1000 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>

                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-white to-slate-200 text-slate-950 shadow-[0_0_50px_rgba(255,255,255,0.15)] mb-6 transition-all hover:scale-110 hover:shadow-white/20 duration-500 group cursor-default">
                        <IndianRupee size={36} className="group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            Ar-System
                        </h1>
                        <p className="text-blue-400/80 font-bold text-[10px] tracking-[0.4em] uppercase">
                            Secure Financial Gateway
                        </p>
                    </div>
                </div>

                {/* Glassmorphism Card */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                    <div className="relative overflow-hidden backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-10 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20">

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <ShieldCheck size={18} className="text-red-400 flex-shrink-0" />
                                <p className="text-red-400 text-xs font-semibold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                    Identification
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors duration-300">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 focus:border-blue-500/30 focus:bg-blue-500/5 rounded-2xl text-white font-medium outline-none transition-all duration-300 placeholder:text-slate-600 shadow-inner"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Secret Key
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors duration-300">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 focus:border-indigo-500/30 focus:bg-indigo-500/5 rounded-2xl text-white font-medium outline-none transition-all duration-300 placeholder:text-slate-600 shadow-inner"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden group/btn bg-white text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-blue-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Initialize Protocol
                                            <ArrowRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Footer Stats */}
                        <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center gap-1.5 group/stat cursor-help">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover/stat:bg-blue-500/20 transition-colors">
                                    <Zap size={12} />
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Fast</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 group/stat cursor-help">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover/stat:bg-emerald-500/20 transition-colors">
                                    <ShieldCheck size={12} />
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Secure</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 group/stat cursor-help">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover/stat:bg-indigo-500/20 transition-colors">
                                    <Globe size={12} />
                                </div>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Global</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <p className="mt-8 text-center text-[8px] font-black text-slate-600 uppercase tracking-[0.5em] opacity-50">
                    &copy; MMXXVI Ar-System Infrastructure // Protected Connection
                </p>
            </div>
        </div>
    );
};

export default Login;
