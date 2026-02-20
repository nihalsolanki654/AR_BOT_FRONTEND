import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Shield, Power, Edit2, Trash2, Search, X, Check, MoreVertical, Plus, Users, AlertCircle } from 'lucide-react';

const AddMember = () => {
    const [members, setMembers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        role: 'Member',
        status: 'Active'
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMembers();
    }, []);

    const addToast = (type, text) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, text }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const fetchMembers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/members`);
            if (response.ok) {
                const data = await response.json();
                setMembers(data);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
            addToast('error', 'Failed to load team members');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const url = editingId
            ? `${import.meta.env.VITE_API_URL}/api/members/${editingId}`
            : `${import.meta.env.VITE_API_URL}/api/members`;

        const method = editingId ? 'PUT' : 'POST';

        const payload = { ...formData };
        if (editingId && !payload.password) {
            delete payload.password;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                addToast('success', editingId ? 'Member details updated successfully!' : 'New member registered successfully!');
                resetForm();
                setShowModal(false);
                fetchMembers();
            } else {
                addToast('error', data.message || 'Operation failed');
            }
        } catch (error) {
            addToast('error', 'Connection error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            username: '',
            password: '',
            phone: '',
            role: 'Member',
            status: 'Active'
        });
        setEditingId(null);
    };

    const handleEdit = (member) => {
        setEditingId(member._id);
        setFormData({
            name: member.name,
            email: member.email,
            username: member.username,
            password: '',
            phone: member.phone,
            role: member.role,
            status: member.status
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this member?')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/members/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                addToast('success', 'Member removed from team');
                fetchMembers();
            }
        } catch (error) {
            addToast('error', 'Failed to delete member');
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-4 p-5 rounded-3xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-full duration-300 min-w-[340px] ${toast.type === 'success'
                            ? 'bg-white/90 dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                            : 'bg-white/90 dark:bg-slate-900/90 border-rose-100 dark:border-rose-500/20 text-rose-800 dark:text-rose-200'
                            }`}
                    >
                        <div className={`p-2.5 rounded-2xl ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-[13px] tracking-tight">{toast.type === 'success' ? 'SUCCESS' : 'ATTENTION'}</p>
                            <p className="text-xs font-medium opacity-80 mt-0.5 leading-relaxed">{toast.text}</p>
                        </div>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors opacity-40 hover:opacity-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 md:mb-16">
                <div className="text-center lg:text-left space-y-2">
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                        <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                            <Users size={24} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Team Intelligence</h1>
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-md mx-auto lg:mx-0 leading-relaxed">
                        Optimize your organization by managing access rights and monitoring team activity in real-time.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Glassmorphism search */}
                    <div className="relative group w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all" size={18} />
                        <input
                            type="text"
                            placeholder="Find member..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 font-bold text-sm w-full shadow-sm hover:shadow-md transition-all outline-none dark:text-slate-200"
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-[28px] font-black hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-slate-900/10 dark:shadow-blue-500/20 text-sm w-full sm:w-auto overflow-hidden relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                        <UserPlus size={20} />
                        Register Member
                    </button>
                </div>
            </div>

            {/* Premium Table Layout */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-400 dark:text-slate-500 text-[11px] font-black border-b border-slate-100 dark:border-slate-800 uppercase tracking-[0.2em]">
                                <th className="px-10 py-6 text-left">Identity Profile</th>
                                <th className="px-10 py-6 text-left">Security & Access</th>
                                <th className="px-10 py-6 text-left">Status</th>
                                <th className="px-10 py-6 text-right pr-14">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                                <tr key={member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all group duration-300">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 transition-colors ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-none mb-1.5 transition-colors">{member.name}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">@{member.username}</span>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 lowercase">
                                                        <Mail size={12} />
                                                        {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-3">
                                            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl w-fit border-2 ${member.role === 'Admin' ? 'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-900/20 dark:border-purple-500/30 dark:text-purple-300' :
                                                    member.role === 'Manager' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-300' :
                                                        'bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                                }`}>
                                                <Shield size={14} className="opacity-70" />
                                                <span className="text-xs font-black uppercase tracking-wider">{member.role}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 ml-1">
                                                <Phone size={12} className="opacity-50" />
                                                {member.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-4 py-1.5 rounded-[14px] text-[10px] font-black tracking-widest uppercase transition-all shadow-sm ${member.status === 'Active'
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 shadow-none'
                                                }`}>
                                                {member.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right pr-14">
                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            <button
                                                onClick={() => handleEdit(member)}
                                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-500/30 shadow-sm transition-all active:scale-90"
                                                title="Edit Settings"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member._id)}
                                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm transition-all active:scale-90"
                                                title="Revoke Access"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 py-10 opacity-30">
                                            <Users size={64} className="text-slate-400" />
                                            <p className="font-black text-xl text-slate-500 tracking-tight uppercase">Intelligence Database Empty</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Redesigned Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white dark:bg-slate-950 w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20 dark:border-slate-800 flex flex-col max-h-[92vh]">

                        {/* Modal Header */}
                        <div className="px-8 md:px-12 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-[24px] ${editingId ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'}`}>
                                    {editingId ? <Edit2 size={24} /> : <UserPlus size={24} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                        {editingId ? 'Modify Access' : 'Register Expert'}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Configure security profile and credentials</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all hover:scale-110">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Modal Body - Grouped Sections */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar">
                            <form onSubmit={handleSubmit} id="member-form">
                                <div className="space-y-12">

                                    {/* Section 1: Identity */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                                            <div className="w-1.5 h-6 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Personnel Metadata</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase">Full Name</label>
                                                <input
                                                    type="text" name="name" value={formData.name} onChange={handleChange} required
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 font-bold text-slate-900 dark:text-white transition-all outline-none"
                                                    placeholder="e.g. John Doe"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase">Alias (Username)</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                                                    <input
                                                        type="text" name="username" value={formData.username} onChange={handleChange} required
                                                        className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 font-bold text-slate-900 dark:text-white transition-all outline-none"
                                                        placeholder="john.dev"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase">Primary Contact</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input
                                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 font-bold text-slate-900 dark:text-white transition-all outline-none"
                                                        placeholder="contact@agency.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase">Mobile Intel</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input
                                                        type="text" name="phone" value={formData.phone} onChange={handleChange} required
                                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 font-bold text-slate-900 dark:text-white transition-all outline-none"
                                                        placeholder="+91"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Security */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-amber-500">
                                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Access & Protocol</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase">Security Authorization</label>
                                                <div className="relative group">
                                                    <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={16} />
                                                    <select name="role" value={formData.role} onChange={handleChange} className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 dark:text-white appearance-none cursor-pointer">
                                                        <option value="Member">Team Member</option>
                                                        <option value="Manager">Finance Manager</option>
                                                        <option value="Admin">System Administrator</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase">Account Integrity</label>
                                                <div className="relative group">
                                                    <Power className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 dark:text-white appearance-none cursor-pointer">
                                                        <option value="Active">Operational (Active)</option>
                                                        <option value="Inactive">Frozen (Inactive)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase">Cypher (Password)</label>
                                                <input
                                                    type="password" name="password" value={formData.password} onChange={handleChange}
                                                    required={!editingId}
                                                    className="w-full px-6 py-5 bg-slate-900 border-none rounded-2xl md:rounded-[28px] text-white font-mono text-center tracking-[0.5em] focus:ring-4 focus:ring-blue-500/30 transition-all outline-none placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-600"
                                                    placeholder={editingId ? "LEAVE TO RETAIN" : "SECURE PASSCODE"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 md:px-12 py-8 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 shrink-0">
                            <button
                                type="submit" form="member-form" disabled={loading}
                                className={`flex-1 py-5 rounded-[28px] font-black shadow-2xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${editingId
                                        ? 'bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600'
                                        : 'bg-slate-900 dark:bg-blue-600 text-white shadow-slate-900/30 dark:shadow-blue-500/30 hover:bg-black dark:hover:bg-blue-700'
                                    } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {editingId ? <Edit2 size={20} /> : <Check size={20} />}
                                        {editingId ? 'Push Updates' : 'Confirm Registration'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-12 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-[28px] font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm uppercase tracking-wider"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddMember;
