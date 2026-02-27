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
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.3 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.reset();
                }
            }
            draw() {
                ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`; // Indigo particles
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

    return <canvas id="particle-canvas" className="absolute inset-0 z-0 pointer-events-none opacity-20" />;
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
        <div className="h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-[#f8fafc] font-inter selection:bg-indigo-100 selection:text-indigo-900">

            {/* dynamic Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <ParticleBackground />

                {/* soft Airy Aurora Blobs (Light theme) */}
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full bg-blue-100/50 blur-[130px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-50/60 blur-[130px] animate-pulse" style={{ animationDelay: '3s' }}></div>

                {/* grid Texture for Structure */}
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>
            </div>

            {/* Content Container */}
            <div className={`relative z-10 w-full max-w-[420px] transition-all duration-1000 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

                {/* Brand Header */}
                <div className="text-center mb-10">
                    <div className="space-y-3">
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter font-outfit">
                            Ar-System
                        </h1>
                        <p className="text-indigo-500 font-bold text-[11px] tracking-[0.6em] uppercase">
                            Digital Finance Infrastructure
                        </p>
                    </div>
                </div>

                {/* Light Glass-Zinc Card */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-white to-white/50 rounded-[2.5rem] blur-2xl opacity-50"></div>

                    <div className="relative overflow-hidden backdrop-blur-2xl bg-white/70 border border-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-10 md:p-14 transition-all duration-700 hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.12)] hover:-translate-y-1">

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in zoom-in-95">
                                <p className="text-red-600 text-[11px] font-bold text-center uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">
                                    Identity Profile
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-7 py-5 bg-white border border-slate-100 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl text-slate-900 font-medium outline-none transition-all duration-300 placeholder:text-slate-300 shadow-sm"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">
                                    Secure Key
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-7 py-5 bg-white border border-slate-100 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl text-slate-900 font-medium outline-none transition-all duration-300 placeholder:text-slate-300 shadow-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden group/btn bg-gradient-to-tr from-indigo-600 to-violet-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(79,70,229,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Authenticate Process"
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em] mb-4">
                        Secure Environment MMXXVI
                    </p>
                    <div className="h-[1px] w-12 bg-slate-200 mx-auto"></div>
                </div>
            </div>
        </div>
    );
};

export default Login;
