import React, { useState, useEffect } from 'react';
import { Plus, Mail, Pencil, Trash2, X, PlusCircle, MinusCircle, Building2, Save, AlertCircle } from 'lucide-react';

const CompanyEmails = () => {
    const [configurations, setConfigurations] = useState([]);
    const [unconfigured, setUnconfigured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        toEmails: [''],
        ccEmails: ['']
    });

    useEffect(() => {
        fetchConfigurations();
        fetchUnconfigured();
    }, []);

    const fetchConfigurations = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/company-emails`);
            if (response.ok) {
                const data = await response.json();
                setConfigurations(data);
            }
        } catch (error) {
            console.error('Error fetching configurations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnconfigured = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/company-emails/unconfigured`);
            if (response.ok) {
                const data = await response.json();
                setUnconfigured(data);
            }
        } catch (error) {
            console.error('Error fetching unconfigured companies:', error);
        }
    };

    const handleOpenAddModal = () => {
        setEditingConfig(null);
        setIsManualEntry(false);
        setFormData({
            companyName: '',
            toEmails: [''],
            ccEmails: ['']
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (config) => {
        setEditingConfig(config);
        setFormData({
            companyName: config.companyName,
            toEmails: config.toEmails.length > 0 ? config.toEmails : [''],
            ccEmails: config.ccEmails.length > 0 ? config.ccEmails : ['']
        });
        setIsModalOpen(true);
    };

    const handleEmailChange = (index, value, type) => {
        const field = type === 'to' ? 'toEmails' : 'ccEmails';
        const newEmails = [...formData[field]];
        newEmails[index] = value;
        setFormData({ ...formData, [field]: newEmails });
    };

    const addEmailField = (type) => {
        const field = type === 'to' ? 'toEmails' : 'ccEmails';
        const limit = type === 'to' ? 4 : 8;
        if (formData[field].length < limit) {
            setFormData({ ...formData, [field]: [...formData[field], ''] });
        }
    };

    const removeEmailField = (index, type) => {
        const field = type === 'to' ? 'toEmails' : 'ccEmails';
        if (formData[field].length > 1) {
            const newEmails = formData[field].filter((_, i) => i !== index);
            setFormData({ ...formData, [field]: newEmails });
        } else {
            const newEmails = [...formData[field]];
            newEmails[0] = '';
            setFormData({ ...formData, [field]: newEmails });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clean up empty emails
        const payload = {
            companyName: formData.companyName,
            toEmails: formData.toEmails.filter(email => email.trim() !== ''),
            ccEmails: formData.ccEmails.filter(email => email.trim() !== '')
        };

        if (payload.toEmails.length === 0) {
            alert('At least one "To" email is required');
            return;
        }

        try {
            const url = editingConfig
                ? `${import.meta.env.VITE_API_URL}/api/company-emails/${editingConfig._id}`
                : `${import.meta.env.VITE_API_URL}/api/company-emails`;

            const method = editingConfig ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchConfigurations();
                fetchUnconfigured();
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this configuration?')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/company-emails/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchConfigurations();
                fetchUnconfigured();
            }
        } catch (error) {
            console.error('Error deleting configuration:', error);
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto mt-0 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="text-blue-600" size={20} />
                        Company Email Settings
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">Manage email recipients for automated invoice sending</p>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all text-sm transition-all"
                >
                    <Plus size={18} />
                    Configure New Company
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            ) : configurations.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Building2 className="text-blue-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No configurations found</h3>
                    <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Start by adding email recipients for companies found in your invoices.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">To Emails</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">CC Emails</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {configurations.map((item, index) => {
                                    const config = item.config;
                                    return (
                                        <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{item.companyName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {config && config.toEmails.length > 0 ? config.toEmails.map((email, i) => (
                                                        <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-md border border-blue-100 dark:border-blue-900/30 flex items-center gap-1">
                                                            <Mail size={10} /> {email}
                                                        </span>
                                                    )) : <span className="text-amber-500 dark:text-amber-400 text-xs font-semibold italic flex items-center gap-1"><AlertCircle size={12} /> Email Required</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {config && config.ccEmails.length > 0 ? config.ccEmails.map((email, i) => (
                                                        <span key={i} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-semibold rounded-md border border-gray-200 dark:border-slate-700 flex items-center gap-1">
                                                            <Mail size={10} /> {email}
                                                        </span>
                                                    )) : <span className="text-gray-400 dark:text-slate-600 text-xs italic">No CC</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {config ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenEditModal(config)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                                title="Edit Emails"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(config._id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title="Remove Emails"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingConfig(null);
                                                                setIsManualEntry(false);
                                                                setFormData({
                                                                    companyName: item.companyName,
                                                                    toEmails: [''],
                                                                    ccEmails: ['']
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
                                                        >
                                                            <Plus size={14} /> Add Emails
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    {editingConfig ? 'Update Configuration' : 'Add Configuration'}
                                </h2>
                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">COMPANY EMAIL PROFILE</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {/* Company Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 size={14} className="text-blue-500" />
                                    Select Company
                                </label>
                                {editingConfig ? (
                                    <div className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 font-bold text-sm">
                                        {formData.companyName}
                                    </div>
                                ) : isManualEntry ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            placeholder="Enter company name..."
                                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all text-sm"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsManualEntry(false);
                                                setFormData({ ...formData, companyName: '' });
                                            }}
                                            className="px-3 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl transition-colors font-medium border border-gray-200 dark:border-slate-700 text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.companyName}
                                        onChange={(e) => {
                                            if (e.target.value === 'manual_entry') {
                                                setIsManualEntry(true);
                                                setFormData({ ...formData, companyName: '' });
                                            } else {
                                                setFormData({ ...formData, companyName: e.target.value });
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all appearance-none text-sm"
                                    >
                                        <option value="">Select a company from invoices</option>
                                        {unconfigured.map((name) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                        <option value="manual_entry" className="font-bold text-blue-600">+ Add Manual Company</option>
                                    </select>
                                )}
                                {!editingConfig && !isManualEntry && unconfigured.length === 0 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 mt-2">
                                        <AlertCircle size={14} /> No new companies found in invoices
                                    </p>
                                )}
                            </div>

                            {/* To Emails */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Mail size={14} className="text-blue-500" />
                                        Primary Recipients (To)
                                    </label>
                                    <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 rounded-full">MAX 4</span>
                                </div>
                                <div className="space-y-2">
                                    {formData.toEmails.map((email, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => handleEmailChange(index, e.target.value, 'to')}
                                                placeholder="recipient@example.com"
                                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-medium text-sm focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeEmailField(index, 'to')}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                                            >
                                                <MinusCircle size={20} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.toEmails.length < 4 && (
                                        <button
                                            type="button"
                                            onClick={() => addEmailField('to')}
                                            className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-200 dark:border-blue-900/40 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all"
                                        >
                                            <PlusCircle size={16} />
                                            Add Another Email
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* CC Emails */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Mail size={14} className="text-slate-400" />
                                        CC Recipients
                                    </label>
                                    <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-50 dark:bg-slate-500/10 rounded-full">MAX 8</span>
                                </div>
                                <div className="space-y-2">
                                    {formData.ccEmails.map((email, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => handleEmailChange(index, e.target.value, 'cc')}
                                                placeholder="cc@example.com"
                                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-medium text-sm focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-900/20 focus:border-slate-400 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeEmailField(index, 'cc')}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                                            >
                                                <MinusCircle size={20} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.ccEmails.length < 8 && (
                                        <button
                                            type="button"
                                            onClick={() => addEmailField('cc')}
                                            className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/5 transition-all"
                                        >
                                            <PlusCircle size={16} />
                                            Add CC Recipient
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all"
                                >
                                    <Save size={16} />
                                    {editingConfig ? 'UPDATE PROFILE' : 'SAVE CONFIGURATION'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyEmails;
