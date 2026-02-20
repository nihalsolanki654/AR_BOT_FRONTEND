import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, IndianRupee, Mail, Phone, User, MapPin, Calendar, Hash, Plus, Trash2, AlertCircle } from 'lucide-react';

const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry",
    "Ladakh", "Jammu and Kashmir"
];

const AddInvoice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        customerName: '',
        customerEmail: '',
        customerMobile: '',
        customerState: '',
        gross: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
        paymentStatus: 'Due',
        paidAmount: 0
    });

    useEffect(() => {
        const gross = parseFloat(formData.gross) || 0;
        const cgst = parseFloat(formData.cgst) || 0;
        const sgst = parseFloat(formData.sgst) || 0;
        const igst = parseFloat(formData.igst) || 0;

        setFormData(prev => ({
            ...prev,
            total: Math.round(gross + cgst + sgst + igst)
        }));
    }, [formData.gross, formData.cgst, formData.sgst, formData.igst]);

    useEffect(() => {
        const fetchLatestInvoice = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/latest`);
                if (response.ok) {
                    const latestInvoice = await response.json();
                    if (!latestInvoice) {
                        setFormData(prev => ({ ...prev, invoiceNumber: 'INV-001' }));
                    } else {
                        const lastIdObj = latestInvoice.invoiceNumber;
                        const parts = lastIdObj.split('-');
                        if (parts.length === 2) {
                            const number = parseInt(parts[1], 10);
                            const nextNumber = number + 1;
                            const nextId = `INV-${nextNumber.toString().padStart(3, '0')}`;
                            setFormData(prev => ({ ...prev, invoiceNumber: nextId }));
                        } else {
                            setFormData(prev => ({ ...prev, invoiceNumber: 'INV-001' }));
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching latest invoice:', error);
                setFormData(prev => ({ ...prev, invoiceNumber: 'INV-001' }));
            }
        };
        fetchLatestInvoice();
    }, []);

    useEffect(() => {
        const gross = parseFloat(formData.gross) || 0;
        if (formData.customerState === 'Gujarat') {
            const taxValue = Math.round(gross * 0.09);
            setFormData(prev => ({ ...prev, cgst: taxValue, sgst: taxValue, igst: 0 }));
        } else if (formData.customerState) {
            const taxValue = Math.round(gross * 0.18);
            setFormData(prev => ({ ...prev, cgst: 0, sgst: 0, igst: taxValue }));
        } else {
            setFormData(prev => ({ ...prev, cgst: 0, sgst: 0, igst: 0 }));
        }
    }, [formData.customerState, formData.gross]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'paidAmount') {
            const val = parseFloat(value) || 0;
            const total = parseFloat(formData.total) || 0;
            if (val > total) return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getDueDays = (dateStr) => {
        if (!dateStr) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateStr);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                navigate('/invoices');
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Failed to save invoice.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                {/* Header */}


                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 md:y-10">
                    {/* Section 1: Basic Info */}
                    <section>
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Hash size={18} className="text-blue-500" />
                                <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Invoice Details</h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Invoice Number</label>
                                <input
                                    type="text" value={formData.invoiceNumber} readOnly
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-500 font-medium cursor-not-allowed outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Invoice Date</label>
                                <input
                                    required type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all dark:[color-scheme:dark]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Due Date</label>
                                <input
                                    required type="date" name="dueDate" value={formData.dueDate} onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Client Info */}
                    <section>
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <User size={18} className="text-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Client Information</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Customer Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                                    <input
                                        required type="text" name="customerName" value={formData.customerName} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Customer State</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                                    <select
                                        required name="customerState" value={formData.customerState} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="dark:bg-slate-900">Select State</option>
                                        {indianStates.map((state) => (
                                            <option key={state} value={state} className="dark:bg-slate-900">{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                                    <input
                                        type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                                    <input
                                        type="tel" name="customerMobile" value={formData.customerMobile} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all"
                                        placeholder="+91 00000 00000"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Financials */}
                    <section className="bg-gray-50 dark:bg-slate-800/20 px-6 py-8 md:px-8 md:py-10 border-y border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200 dark:border-slate-700">
                            <IndianRupee size={18} className="text-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Financial Details</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500">Gross Amount</label>
                                <input
                                    required type="number" name="gross" value={formData.gross} onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500">CGST (9%)</label>
                                <input
                                    type="number" readOnly value={formData.cgst}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border-none rounded-xl text-gray-500 dark:text-slate-400 font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500">SGST (9%)</label>
                                <input
                                    type="number" readOnly value={formData.sgst}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border-none rounded-xl text-gray-500 dark:text-slate-400 font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500">IGST (18%)</label>
                                <input
                                    type="number" readOnly value={formData.igst}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border-none rounded-xl text-gray-500 dark:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <div className="w-full md:w-80 space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span>₹{Math.round(formData.gross || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                                    <span>Total Tax</span>
                                    <span>₹{Math.round(parseFloat(formData.cgst || 0) + parseFloat(formData.sgst || 0) + parseFloat(formData.igst || 0)).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-slate-700">
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">Grand Total</span>
                                    <span className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">₹{Math.round(formData.total || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Payment */}
                    <section>
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <Calendar size={18} className="text-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Payment Information</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-3">
                                {['Due', 'Paid', 'PartiallyPaid'].map((status) => (
                                    <button
                                        key={status} type="button" onClick={() => setFormData(prev => ({ ...prev, paymentStatus: status }))}
                                        className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition-all ${formData.paymentStatus === status
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        {status === 'PartiallyPaid' ? 'Partial' : status}
                                    </button>
                                ))}
                            </div>

                            {formData.paymentStatus === 'PartiallyPaid' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 max-w-md">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Paid Amount</label>
                                        <input
                                            required type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} max={formData.total}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-50 dark:focus:ring-emerald-900/20 focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center font-bold shadow-sm">!</div>
                                            <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">Balance Due</span>
                                        </div>
                                        <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                            ₹{Math.round(Math.max(0, (formData.total || 0) - (formData.paidAmount || 0))).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-4">
                        <button
                            type="button" onClick={() => navigate('/invoices')}
                            className="px-8 py-3 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={loading}
                            className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <><Save size={18} /> Save Invoice</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddInvoice;
