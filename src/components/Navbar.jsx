import React, { useState, useEffect } from 'react';
import { Bell, User, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { theme } = useTheme();
    const [user, setUser] = useState({ name: 'Guest', role: 'Unknown Role' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (err) {
                console.error('Error parsing user from localStorage:', err);
            }
        }
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 h-16 px-8 flex items-center justify-between shadow-sm border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 w-full text-sm outline-none transition-all dark:text-slate-200 dark:placeholder-slate-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <Bell size={20} className="text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </div>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-slate-800">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{user.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{user.role}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
