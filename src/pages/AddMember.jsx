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
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-4 p-5 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full duration-300 min-w-[320px] ${toast.type === 'success'
                            ? 'bg-white border-emerald-100 text-emerald-800 shadow-emerald-500/10'
                            : 'bg-white border-rose-100 text-rose-800 shadow-rose-500/10'
                            }`}
                    >
                        <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">{toast.type === 'success' ? 'Success' : 'Attention'}</p>
                            <p className="text-xs font-medium opacity-70 mt-0.5">{toast.text}</p>
                        </div>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="p-1 hover:bg-gray-50 rounded-lg transition-colors opacity-50"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors">Team Members</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium transition-colors">Manage team access and profile details</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search team..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 md:py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm w-full sm:w-64 lg:w-72 shadow-sm transition-all outline-none dark:text-slate-200"
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/10 text-sm w-full sm:w-auto"
                    >
                        <Plus size={20} />
                        Add Member
                    </button>
                </div>
            </div>

            {/* Premium Listing Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] md:min-w-full">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 text-[10px] md:text-xs font-bold border-b border-gray-100 dark:border-slate-800 uppercase tracking-widest">
                                <th className="px-6 md:px-10 py-4 md:py-6 text-left">Member</th>
                                <th className="px-6 md:px-10 py-4 md:py-6 text-left hidden sm:table-cell">Personal Info</th>
                                <th className="px-6 md:px-10 py-4 md:py-6 text-left">Access & Status</th>
                                <th className="px-6 md:px-10 py-4 md:py-6 text-right pr-12">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {filteredMembers.map((member) => (
                                <tr key={member._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group">
                                    <td className="px-6 md:px-10 py-6 md:py-8">
                                        <div className="flex items-center gap-4 md:gap-5">
                                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg shadow-blue-500/20">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm md:text-base leading-tight transition-colors">{member.name}</p>
                                                <p className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">@{member.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-6 md:py-8 hidden sm:table-cell">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-600 dark:text-slate-400">
                                                <Mail size={12} className="text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                                                {member.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-slate-500">
                                                <Phone size={12} />
                                                {member.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-6 md:py-8">
                                        <div className="flex flex-col gap-2 md:gap-3">
                                            <div className="flex items-center gap-2 text-xs md:text-sm font-black text-gray-700 dark:text-white">
                                                <div className={`p-1 w-fit rounded-lg ${member.role === 'Admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    member.role === 'Manager' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    <Shield size={12} />
                                                </div>
                                                {member.role.toUpperCase()}
                                            </div>
                                            <span className={`w-fit px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black transition-colors ${member.status === 'Active'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-700'
                                                }`}>
                                                {member.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-6 md:py-8 text-right pr-6 md:pr-12 space-x-2 md:space-x-3">
                                        <button
                                            onClick={() => handleEdit(member)}
                                            className="p-2 md:p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl md:rounded-2xl text-amber-500 shadow-sm transition-all"
                                            title="Edit Member"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(member._id)}
                                            className="p-2 md:p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl md:rounded-2xl text-rose-500 shadow-sm transition-all"
                                            title="Delete Member"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white dark:bg-slate-950 w-full max-w-2xl rounded-2xl md:rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-slate-800">
                        <div className="p-6 md:p-10">
                            <div className="flex items-center justify-between mb-8 md:mb-10">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${editingId ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                                            {editingId ? <Edit2 size={20} /> : <UserPlus size={20} />}
                                        </div>
                                        {editingId ? 'Edit Team Member' : 'Register New Member'}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium">Please enter member identity details</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 md:p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-400 dark:text-slate-500 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 ml-1">Full Identity</label>
                                        <input
                                            type="text" name="name" value={formData.name} onChange={handleChange} required
                                            className="w-full p-4 md:p-5 bg-gray-50 border-none rounded-xl md:rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 font-bold text-gray-800 dark:text-slate-200 transition-all outline-none border dark:border-slate-800 dark:bg-slate-900/50"
                                            placeholder="Enter name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 ml-1">Unique Username</label>
                                        <input
                                            type="text" name="username" value={formData.username} onChange={handleChange} required
                                            className="w-full p-4 md:p-5 bg-gray-50 border-none rounded-xl md:rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 font-bold text-gray-800 dark:text-slate-200 transition-all outline-none border dark:border-slate-800 dark:bg-slate-900/50"
                                            placeholder="Username"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 ml-1">Secure Password</label>
                                        <input
                                            type="password" name="password" value={formData.password} onChange={handleChange}
                                            required={!editingId}
                                            className="w-full p-5 bg-gray-50 border-none rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 font-bold text-gray-800 dark:text-slate-200 transition-all outline-none border dark:border-slate-800 dark:bg-slate-900/50"
                                            placeholder={editingId ? "Leave empty to keep" : "Password"}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 ml-1">Contact Email</label>
                                        <input
                                            type="email" name="email" value={formData.email} onChange={handleChange} required
                                            className="w-full p-5 bg-gray-50 border-none rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 font-bold text-gray-800 dark:text-slate-200 transition-all outline-none border dark:border-slate-800 dark:bg-slate-900/50"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 ml-1">Mobile Carrier</label>
                                        <input
                                            type="text" name="phone" value={formData.phone} onChange={handleChange} required
                                            className="w-full p-5 bg-gray-50 border-none rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 font-bold text-gray-800 dark:text-slate-200 transition-all outline-none border dark:border-slate-800 dark:bg-slate-900/50"
                                            placeholder="+91"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 ml-1">Role</label>
                                            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-5 bg-gray-50 dark:bg-slate-900 border-none rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 font-semibold outline-none border dark:border-slate-800">
                                                <option value="Member" className="dark:bg-slate-900">Member</option>
                                                <option value="Manager" className="dark:bg-slate-900">Manager</option>
                                                <option value="Admin" className="dark:bg-slate-900">Admin</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 ml-1">Status</label>
                                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-5 bg-gray-50 dark:bg-slate-900 border-none rounded-[20px] focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-900 font-semibold outline-none border dark:border-slate-800">
                                                <option value="Active" className="dark:bg-slate-900">Active</option>
                                                <option value="Inactive" className="dark:bg-slate-900">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="submit" disabled={loading}
                                        className={`flex-1 py-5 rounded-[24px] font-bold shadow-2xl transition-all flex items-center justify-center gap-3 ${editingId ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600' : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
                                            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingId ? 'Update Member' : 'Register Member')}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} className="px-10 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-[24px] font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm">Discard</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddMember;
