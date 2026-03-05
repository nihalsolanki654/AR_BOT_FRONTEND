import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Check,
    ArrowRight
} from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoaded(true);

        // Pre-emptive wake-up pinger for Render backend
        const wakeup = async () => {
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/`);
                console.log('[SYSTEM] Secure node wake-up signal sent.');
            } catch (err) {
                console.warn('[SYSTEM] Initial wake-up signal failed. Node might be initializing.');
            }
        };
        wakeup();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('[AUTH] Initiating verification sequence...');
            // Mapping 'email' state to 'username' property for backend compatibility
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/members/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('[AUTH] Verification successful.');
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('user', JSON.stringify(data.user));

                // Show online count alert as requested
                const count = data.onlineCount || 0;
                window.alert(`Login Successful! Current users logged in: ${count}`);

                navigate('/dashboard');
            } else {
                setError(data.message || 'Authentication failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Connection error. Security infrastructure unreachable or initializing.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-[#fdfcf0] via-[#faf5e8] to-[#f7f2e1] font-poppins selection:bg-[#b08d57]/20 selection:text-[#b08d57] relative overflow-hidden">

            {/* Subtle Texture/Grain */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3BaseFilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/feTurbulence%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            <div className={`relative z-10 w-full max-w-[460px] transition-all duration-1000 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

                {/* Elegant White Card */}
                <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(176,141,87,0.15)] p-10 md:p-14 border border-[#b08d57]/10">

                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-[#4a3f35] tracking-tight mb-3">Finance Team Login</h1>
                        <p className="text-[#b08d57] text-[12px] font-bold uppercase tracking-[0.25em]">Secure Financial Access Portal</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50/50 border border-red-100 rounded-2xl animate-in fade-in zoom-in-95">
                            <p className="text-red-600 text-[11px] font-semibold text-center uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        {/* Minimal Input */}
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-[#a69d91] ml-1 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#fdfcf0]/30 border border-[#e8e4d9] focus:border-[#b08d57]/50 focus:bg-white focus:ring-4 focus:ring-[#b08d57]/5 rounded-2xl px-6 py-4 text-[#4a3f35] outline-none transition-all duration-300 placeholder:text-[#d1cdc2] text-[15px]"
                                    placeholder="yourname@finance.co"
                                    required
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <Mail className="w-4 h-4 text-[#d1cdc2] group-focus-within:text-[#b08d57] transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2 group">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-[#a69d91] uppercase tracking-widest">Credential Key</label>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#fdfcf0]/30 border border-[#e8e4d9] focus:border-[#b08d57]/50 focus:bg-white focus:ring-4 focus:ring-[#b08d57]/5 rounded-2xl px-6 py-4 text-[#4a3f35] outline-none transition-all duration-300 placeholder:text-[#d1cdc2] text-[15px]"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-[#d1cdc2] hover:text-[#b08d57] transition-colors outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-3 cursor-pointer group/check">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe(!rememberMe)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-[#e8e4d9] rounded-md transition-all peer-checked:bg-[#b08d57] peer-checked:border-[#b08d57] group-hover/check:border-[#b08d57]/50"></div>
                                    <Check className="w-3 h-3 text-white absolute transition-opacity opacity-0 peer-checked:opacity-100" />
                                </div>
                                <span className="text-[11px] font-bold text-[#a69d91] uppercase tracking-wider group-hover/check:text-[#6b6257] transition-colors">Remember device</span>
                            </label>
                            <button type="button" className="text-[11px] font-black text-[#b08d57] hover:text-[#8e7246] transition-colors uppercase tracking-widest outline-none">Recovery?</button>
                        </div>

                        {/* Rich Bronze Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden group/btn bg-[#b08d57] text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] transition-all duration-500 hover:shadow-[0_15px_30px_-10px_rgba(176,141,87,0.5)] active:scale-[0.985] disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span>Initializing Node...</span>
                                    </div>
                                ) : (
                                    <>
                                        Authorize Session
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer Info */}
                    <div className="mt-12 text-center">
                        <p className="text-[#d1cdc2] text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Secure Terminal Node</p>
                        <div className="h-px w-8 bg-[#b08d57]/20 mx-auto"></div>
                    </div>
                </div>

                {/* Secure Disclaimer */}
                <p className="mt-8 text-center text-[#d1cdc2] text-[9px] font-bold uppercase tracking-[0.2em]">
                    End-to-End Encryption Active • System Audit Logs in Progress
                </p>
            </div>
        </div>
    );
};

export default Login;
