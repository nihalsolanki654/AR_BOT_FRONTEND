import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus, FileText, UserPlus, LogOut, Briefcase } from 'lucide-react';

const Sidebar = () => {
    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/add-invoice', icon: FilePlus, label: 'Add Invoice' },
        { path: '/invoices', icon: FileText, label: 'Invoices' },
        { path: '/add-member', icon: UserPlus, label: 'Members' },
    ];

    return (
        <div className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 h-screen sticky top-0 p-6 transition-colors duration-300 border-r border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Logo Section */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/30">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">FinancePortal</h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-3">Menu</p>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-gray-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                                    <item.icon size={18} />
                                </div>
                                <span className="font-semibold text-sm">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full group"
                >
                    <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 group-hover:bg-red-200 dark:group-hover:bg-red-500/30">
                        <LogOut size={18} />
                    </div>
                    <span className="font-semibold text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
