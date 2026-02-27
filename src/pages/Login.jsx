import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IndianRupee,
    User,
    Lock,
    ArrowRight,
    ShieldCheck,
    Sparkles,
    Globe,
    ChevronRight,
    LayoutDashboard,
    PieChart as PieChartIcon,
    Wallet
} from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
        <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-500 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40">

            {/* Visual Side - Visible only on LG+ */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-50 dark:bg-slate-900/40 overflow-hidden items-center justify-center p-12 border-r border-slate-100 dark:border-slate-800/50">
                {/* Dynamic Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-400/5 dark:bg-indigo-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 max-w-lg">
                    <div className="mb-12 inline-flex items-center gap-3 px-4 py-2 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-white dark:border-slate-700/50 rounded-2xl shadow-xl shadow-blue-500/5 animate-in slide-in-from-bottom duration-700">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                            <IndianRupee size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Financial Ledger Portal v2.0</span>
                    </div>

                    <h2 className="text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 animate-in slide-in-from-bottom duration-700 delay-100">
                        Manage your <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">financial destiny</span> with precision.
                    </h2>

                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-12 animate-in slide-in-from-bottom duration-700 delay-200">
                        A seamless gateway for organization-wide invoice tracking, team management, and real-time revenue analytics.
                    </p>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom duration-700 delay-300">
                        <div className="p-6 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                                <LayoutDashboard size={20} />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Unified Dashboard</h4>
                            <p className="text-[11px] text-slate-400 font-medium">All stats in one place.</p>
                        </div>
                        <div className="p-6 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                                <Wallet size={20} />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Secure Billing</h4>
                            <p className="text-[11px] text-slate-400 font-medium">Enterprise-grade security.</p>
                        </div>
                    </div>
                </div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            </div>

            {/* Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Background Blobs for Mobile */}
                <div className="lg:hidden absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/50 dark:bg-blue-600/10 blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100/50 dark:bg-indigo-600/10 blur-[100px]"></div>
                </div>

                <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="mb-12 text-center lg:text-left">
                        <div className="lg:hidden inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-6">
                            <IndianRupee className="text-white" size={28} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Portal Access</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Enter your credentials to manage records.</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl animate-in shake duration-500">
                            <p className="text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2">
                                <ShieldCheck size={14} /> {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Username</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-600/5 rounded-2xl text-slate-900 dark:text-white font-semibold outline-none transition-all placeholder:text-slate-400/60"
                                    placeholder="your_username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-600/5 rounded-2xl text-slate-900 dark:text-white font-semibold outline-none transition-all placeholder:text-slate-400/60"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden bg-slate-900 dark:bg-blue-600 text-white py-4.5 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/25"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Enter Account Portal
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Trust Indicators */}
                    <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex flex-wrap justify-center lg:justify-start items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">TLS 1.3 Secure</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Enterprise UI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Global Sync</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Copy */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 lg:left-12 lg:translate-x-0">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                        &copy; 2026 Ar-System Infrastructure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
