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
        <div className="min-h-screen w-full relative flex items-center justify-center p-6 overflow-hidden bg-slate-950 font-sans transition-colors duration-500 selection:bg-blue-500/30 selection:text-white">

            {/* Immersive Animated Mesh Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-purple-600/5 blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

                {/* Minimal Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '80px 80px' }}>
                </div>
            </div>

            {/* Main Auth Container */}
            <div className={`relative z-10 w-full max-w-[460px] transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

                {/* Branding Section */}
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white text-slate-950 shadow-2xl shadow-white/10 mb-4 transition-transform hover:scale-105 duration-500 group">
                        <IndianRupee size={32} className="group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">FinancePortal</h1>
                        <p className="text-slate-400 font-medium text-sm tracking-wide uppercase opacity-70">Unified Account Access</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="backdrop-blur-3xl bg-white/[0.03] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 transition-all hover:bg-white/[0.05] hover:border-white/20">

                    {error && (
                        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in shake duration-500">
                            <p className="text-rose-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                                <ShieldCheck size={14} /> {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        {/* Username Field */}
                        <div className="space-y-3 group">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest transition-colors group-focus-within:text-white">Admin Identity</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-16 pr-8 py-5 bg-white/[0.03] border border-white/10 focus:border-white/30 focus:bg-white/[0.07] rounded-2xl text-white font-medium outline-none transition-all placeholder:text-slate-600 shadow-inner"
                                    placeholder="Username"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-3 group">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest transition-colors group-focus-within:text-white">Access Key</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-16 pr-8 py-5 bg-white/[0.03] border border-white/10 focus:border-white/30 focus:bg-white/[0.07] rounded-2xl text-white font-medium outline-none transition-all placeholder:text-slate-600 shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative overflow-hidden bg-white text-slate-950 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-white/20"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Authorize & Enter
                                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Meta Info */}
                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-between items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-blue-500" /> Fast Execution
                        </div>
                        <div className="flex items-center gap-2">
                            <Fingerprint size={14} className="text-emerald-500" /> Biometric Ready
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={14} className="text-indigo-400" /> SSL Encrypted
                        </div>
                    </div>
                </div>

                {/* System Copyright */}
                <p className="mt-12 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                    &copy; MMXXVI Ar-System Infrastructure. V4.0.2
                </p>
            </div>
        </div>
    );
};

export default Login;
