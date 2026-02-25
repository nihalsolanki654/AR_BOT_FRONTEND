import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Mail, Plus, Trash2, Edit3, Save, X, Search, Users, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function CompanyEmails() {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ toEmails: [], ccEmails: [] });
    const [newToEmail, setNewToEmail] = useState('');
    const [newCcEmail, setNewCcEmail] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCompanies = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/customer-emails`);
            const data = await res.json();
            setCompanies(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast('Failed to load company emails', 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const startEdit = (company) => {
        setEditingId(company._id);
        setEditData({
            toEmails: [...(company.toEmails || [])],
            ccEmails: [...(company.ccEmails || [])],
        });
        setNewToEmail('');
        setNewCcEmail('');
        setExpandedId(company._id);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({ toEmails: [], ccEmails: [] });
        setNewToEmail('');
        setNewCcEmail('');
    };

    const addEmail = (type) => {
        const email = type === 'to' ? newToEmail.trim() : newCcEmail.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }
        if (type === 'to') {
            if (editData.toEmails.length >= 4) {
                showToast('Maximum 4 TO email addresses allowed.', 'error');
                return;
            }
            if (editData.toEmails.includes(email)) { showToast('Email already added.', 'error'); return; }
            setEditData(prev => ({ ...prev, toEmails: [...prev.toEmails, email] }));
            setNewToEmail('');
        } else {
            if (editData.ccEmails.length >= 8) {
                showToast('Maximum 8 CC email addresses allowed.', 'error');
                return;
            }
            if (editData.ccEmails.includes(email)) { showToast('Email already added.', 'error'); return; }
            setEditData(prev => ({ ...prev, ccEmails: [...prev.ccEmails, email] }));
            setNewCcEmail('');
        }
    };

    const removeEmail = (type, index) => {
        if (type === 'to') {
            setEditData(prev => ({ ...prev, toEmails: prev.toEmails.filter((_, i) => i !== index) }));
        } else {
            setEditData(prev => ({ ...prev, ccEmails: prev.ccEmails.filter((_, i) => i !== index) }));
        }
    };

    const saveEdit = async (id) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/customer-emails/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });
            if (!res.ok) {
                const err = await res.json();
                showToast(err.message || 'Failed to save.', 'error');
                return;
            }
            showToast('Company emails updated!', 'success');
            cancelEdit();
            fetchCompanies();
        } catch {
            showToast('Network error. Try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteCompany = async (id) => {
        if (!window.confirm('Delete this company record?')) return;
        try {
            await fetch(`${API_URL}/api/customer-emails/${id}`, { method: 'DELETE' });
            showToast('Company deleted.', 'success');
            fetchCompanies();
        } catch {
            showToast('Failed to delete.', 'error');
        }
    };

    const filtered = companies.filter(c =>
        c.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold border transition-all ${toast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                    : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'}`}>
                    {toast.message}
                </div>
            )}

            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Building2 size={20} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Company Emails</h1>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">
                    Manage TO and CC email addresses for each company. Auto-populated from invoices.
                </p>
            </div>

            {/* Search */}
            <div className="mb-6 flex items-center gap-3 max-w-md">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search company..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                    />
                </div>
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{filtered.length} companies</span>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Building2 size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No companies found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {searchQuery ? 'Try a different search term.' : 'Companies are auto-added when you create invoices.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(company => {
                        const isEditing = editingId === company._id;
                        const isExpanded = expandedId === company._id;
                        const toCount = (company.toEmails || []).length;
                        const ccCount = (company.ccEmails || []).length;

                        return (
                            <div key={company._id}
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                                {/* Company Row */}
                                <div className="flex items-center gap-4 px-6 py-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-800 dark:text-slate-100 text-[15px] truncate">{company.companyName}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-slate-400">
                                                <span className="font-bold text-slate-500 dark:text-slate-300">{toCount}</span>/4 TO
                                            </span>
                                            <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                                            <span className="text-xs text-slate-400">
                                                <span className="font-bold text-slate-500 dark:text-slate-300">{ccCount}</span>/8 CC
                                            </span>
                                            {toCount === 0 && ccCount === 0 && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                                    No emails yet
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => startEdit(company)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            title="Edit Emails">
                                            <Edit3 size={14} />
                                        </button>
                                        <button onClick={() => setExpandedId(isExpanded ? null : company._id)}
                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            title="Expand">
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        <button onClick={() => deleteCompany(company._id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded / Edit Panel */}
                                {(isExpanded || isEditing) && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-5 space-y-5 bg-slate-50/50 dark:bg-slate-800/30">

                                        {/* TO Emails */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Mail size={11} /> TO Emails
                                                    <span className="font-normal text-slate-400 dark:text-slate-500 normal-case tracking-normal">(max 4)</span>
                                                </label>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {(isEditing ? editData.toEmails : company.toEmails || []).map((email, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[12px] font-medium border border-indigo-100 dark:border-indigo-800">
                                                        {email}
                                                        {isEditing && (
                                                            <button onClick={() => removeEmail('to', i)}
                                                                className="hover:text-indigo-900 ml-0.5">
                                                                <X size={11} />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                                {(isEditing ? editData.toEmails : company.toEmails || []).length === 0 && (
                                                    <span className="text-[12px] text-slate-400 italic">No TO emails added</span>
                                                )}
                                            </div>
                                            {isEditing && (isEditing ? editData.toEmails : []).length < 4 && (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        placeholder="Add TO email..."
                                                        value={newToEmail}
                                                        onChange={e => setNewToEmail(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addEmail('to')}
                                                        className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700"
                                                    />
                                                    <button onClick={() => addEmail('to')}
                                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all flex items-center gap-1">
                                                        <Plus size={13} /> Add
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* CC Emails */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Users size={11} /> CC Emails
                                                    <span className="font-normal text-slate-400 dark:text-slate-500 normal-case tracking-normal">(max 8)</span>
                                                </label>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {(isEditing ? editData.ccEmails : company.ccEmails || []).map((email, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[12px] font-medium border border-slate-200 dark:border-slate-600">
                                                        {email}
                                                        {isEditing && (
                                                            <button onClick={() => removeEmail('cc', i)}
                                                                className="hover:text-slate-900 dark:hover:text-slate-100 ml-0.5">
                                                                <X size={11} />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                                {(isEditing ? editData.ccEmails : company.ccEmails || []).length === 0 && (
                                                    <span className="text-[12px] text-slate-400 italic">No CC emails added</span>
                                                )}
                                            </div>
                                            {isEditing && (isEditing ? editData.ccEmails : []).length < 8 && (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        placeholder="Add CC email..."
                                                        value={newCcEmail}
                                                        onChange={e => setNewCcEmail(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addEmail('cc')}
                                                        className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                                                    />
                                                    <button onClick={() => addEmail('cc')}
                                                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm font-semibold transition-all flex items-center gap-1">
                                                        <Plus size={13} /> Add
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        {isEditing && (
                                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                                                <button
                                                    onClick={() => saveEdit(company._id)}
                                                    disabled={saving}
                                                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50">
                                                    {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
                                                    {saving ? 'Saving...' : 'Save Changes'}
                                                </button>
                                                <button onClick={cancelEdit}
                                                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-all">
                                                    <X size={13} /> Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
