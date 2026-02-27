import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Lock,
    ArrowRight
} from 'lucide-react';

const ParticleBackground = () => {
    useEffect(() => {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.reset();
                }
            }
            draw() {
                ctx.fillStyle = `rgba(167, 139, 250, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 60; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas id="particle-canvas" className="absolute inset-0 z-0 pointer-events-none opacity-40" />;
};

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
        <div className="h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-[#0a0a0b] font-inter selection:bg-violet-500/30 selection:text-white">

            {/* dynamic Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <ParticleBackground />

                {/* sophisticated Aurora Blobs (Charcoal/Violet theme) */}
                <div className="absolute -top-[15%] -right-[10%] w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[150px] animate-pulse transition-transform duration-[20s]"></div>
                <div className="absolute -bottom-[15%] -left-[10%] w-[700px] h-[700px] rounded-full bg-indigo-900/10 blur-[150px] animate-pulse transition-transform duration-[18s]" style={{ animationDelay: '4s' }}></div>

                {/* noise Texture for Depth */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
                    style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}>
                </div>
            </div>

            {/* Content Container */}
            <div className={`relative z-10 w-full max-w-[420px] transition-all duration-1000 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>

                {/* Brand Header */}
                <div className="text-center mb-12">
                    <div className="space-y-3">
                        <h1 className="text-6xl font-black text-white tracking-tighter font-outfit bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/40">
                            Ar-System
                        </h1>
                        <p className="text-violet-400 font-bold text-[11px] tracking-[0.6em] uppercase opacity-80">
                            Enterprise Finance Layer
                        </p>
                    </div>
                </div>

                {/* Glass-Zinc Card */}
                <div className="relative group perspective-1000">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-violet-500/20 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>

                    <div className="relative overflow-hidden backdrop-blur-3xl bg-[#16161a]/[0.4] border border-white/[0.08] rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] p-10 md:p-14 transition-all duration-500 group-hover:bg-[#16161a]/[0.6] group-hover:border-white/[0.12] group-hover:-translate-y-1">

                        {error && (
                            <div className="mb-8 p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                                <p className="text-red-400 text-xs font-bold w-full text-center">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-[0.2em]">
                                    Identity Profile
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-7 py-5 bg-[#0a0a0b]/40 border border-white/[0.05] focus:border-violet-500/30 focus:bg-violet-500/[0.03] rounded-2xl text-white font-medium outline-none transition-all duration-300 placeholder:text-slate-700 shadow-inner"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                                    Access Key
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-7 py-5 bg-[#0a0a0b]/40 border border-white/[0.05] focus:border-violet-500/30 focus:bg-violet-500/[0.03] rounded-2xl text-white font-medium outline-none transition-all duration-300 placeholder:text-slate-700 shadow-inner"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden group/btn bg-gradient-to-tr from-violet-600 to-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Execute Authentication"
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="mt-12 text-center opacity-40">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">
                        Secure Environment MMXXVI
                    </p>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent mx-auto"></div>
                </div>
            </div>
        </div>
    );
};

export default Login;
