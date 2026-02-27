import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Lock,
    ArrowRight
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
        <div className="h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-[#050505] font-inter selection:bg-indigo-500/30 selection:text-white">

            {/* dynamic Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* aurora Blobs */}
                <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse transition-transform duration-[20s]"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse transition-transform duration-[18s]" style={{ animationDelay: '4s' }}></div>
                <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[150px] animate-pulse transition-transform duration-[25s]" style={{ animationDelay: '7s' }}></div>

                {/* mesh Overlay */}
                <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>

                {/* dynamic Glow Line */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent blur-sm"></div>
            </div>

            {/* Content Container */}
            <div className={`relative z-10 w-full max-w-[400px] transition-all duration-1000 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

                {/* Brand Header */}
                <div className="text-center mb-10">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black text-white tracking-tighter font-outfit bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/30">
                            Ar-System
                        </h1>
                        <p className="text-indigo-400/60 font-bold text-[10px] tracking-[0.4em] uppercase">
                            Digital Finance Infrastructure
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] p-[1px] opacity-100">
                        <div className="absolute inset-0 bg-[#0a0a0a] rounded-[2.5rem]"></div>
                    </div>

                    <div className="relative overflow-hidden backdrop-blur-3xl bg-white/[0.01] border border-white/[0.05] rounded-[2.5rem] shadow-2xl p-10 md:p-12">

                        {error && (
                            <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                <p className="text-red-400 text-[11px] font-semibold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">
                                    Identity Access
                                </label>
                                <div className="relative group/input">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-6 py-4.5 bg-white/[0.02] border border-white/[0.05] focus:border-indigo-500/30 focus:bg-indigo-500/[0.02] rounded-2xl text-white font-medium outline-none transition-all duration-300 placeholder:text-slate-700"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">
                                    Authorization Key
                                </label>
                                <div className="relative group/input">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-6 py-4.5 bg-white/[0.02] border border-white/[0.05] focus:border-indigo-500/30 focus:bg-indigo-500/[0.02] rounded-2xl text-white font-medium outline-none transition-all duration-300 placeholder:text-slate-700"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden group/btn bg-white text-[#050505] py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-[#050505]/20 border-t-[#050505] rounded-full animate-spin"></div>
                                    ) : (
                                        "Authenticate Protocol"
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="mt-8 text-center space-y-2 opacity-30">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
                        MMXXVI Digital Infrastructure
                    </p>
                    <div className="flex justify-center gap-4">
                        <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
