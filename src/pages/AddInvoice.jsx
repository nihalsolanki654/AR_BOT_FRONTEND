import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, IndianRupee, Mail, Phone, User, MapPin, Calendar, Hash, Plus, Trash2, AlertCircle, Check } from 'lucide-react';

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

    // Helper to calculate all financials at once
    const calculateFinancials = (data) => {
        const qty = parseFloat(data.quantity) || 0;
        const price = parseFloat(data.total_price) || 0;
        const gstRate = parseFloat(data.GST) || 0;
        const subtotal = price * qty;
        const gstAmt = Math.round(subtotal * (gstRate / 100));
        const total = subtotal + gstAmt;

        let newPaid = parseFloat(data.paidAmount) || 0;
        if (data.paymentStatus === 'Paid') {
            newPaid = total;
        } else if (data.paymentStatus === 'Due') {
            newPaid = 0;
        } else if (data.paymentStatus === 'PartiallyPaid') {
            newPaid = Math.min(newPaid, total);
        }

        const newBalance = Math.max(0, total - newPaid);

        return {
            GST_Amount: gstAmt,
            total_Amount: total,
            balance_due: newBalance,
            paidAmount: newPaid
        };
    };

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        Terms: 'Net 30',
        companyName: '',
        State: '',
        total_price: 0,
        GST: 18,
        GST_Amount: 0,
        total_Amount: 0,
        balance_due: 0,
        description: '',
        quantity: 1,
        paymentStatus: 'Due',
        paidAmount: 0
    });

    // Auto-calculate Terms based on Dates
    useEffect(() => {
        if (!formData.invoiceDate || !formData.dueDate) return;

        const start = new Date(formData.invoiceDate);
        const end = new Date(formData.dueDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let terms = '';
        if (diffDays <= 0) {
            terms = 'Due on Receipt';
        } else {
            terms = `${diffDays} days`;
        }

        if (terms !== formData.Terms) {
            setFormData(prev => ({ ...prev, Terms: terms }));
        }
    }, [formData.invoiceDate, formData.dueDate]);

    // Auto-calculate Financials and handle Status synchronization
    useEffect(() => {
        const results = calculateFinancials(formData);

        // Update state ONLY if values actually differ to prevent infinite loops
        if (
            Math.abs((formData.GST_Amount || 0) - results.GST_Amount) > 0.1 ||
            Math.abs((formData.total_Amount || 0) - results.total_Amount) > 0.1 ||
            Math.abs((formData.balance_due || 0) - results.balance_due) > 0.1 ||
            Math.abs((formData.paidAmount || 0) - results.paidAmount) > 0.1
        ) {
            setFormData(prev => ({
                ...prev,
                ...results
            }));
        }
    }, [formData.total_price, formData.quantity, formData.GST, formData.paymentStatus, formData.paidAmount]);

    // Fetch Latest Invoice Number
    useEffect(() => {
        const fetchLatestInvoice = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/latest`);
                if (response.ok) {
                    const latestInvoice = await response.json();
                    if (!latestInvoice) {
                        setFormData(prev => ({ ...prev, invoiceNumber: 'INV-001' }));
                    } else {
                        const lastNum = latestInvoice.invoiceNumber || latestInvoice.invoice_number;
                        if (lastNum && lastNum.includes('-')) {
                            const parts = lastNum.split('-');
                            const number = parseInt(parts[1], 10);
                            const nextId = `INV-${(number + 1).toString().padStart(3, '0')}`;
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'paidAmount') {
            const val = parseFloat(value) || 0;
            const total = parseFloat(formData.total_Amount) || 0;
            if (val > total) return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
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
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 md:y-10">
                    {/* Section 1: Basic Info */}
                    <section>
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Hash size={18} className="text-blue-500" />
                                <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Invoice Details</h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Payment Terms</label>
                                <input
                                    type="text" value={formData.Terms} readOnly
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Company Info */}
                    <section>
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <User size={18} className="text-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Company Information</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Company Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                                    <input
                                        required type="text" name="companyName" value={formData.companyName} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Full Company Name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">State</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                                    <select
                                        name="State" value={formData.State} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="dark:bg-slate-900">Select State</option>
                                        {indianStates.map((state) => (
                                            <option key={state} value={state} className="dark:bg-slate-900">{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Item Details */}
                    <section>
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <Plus size={18} className="text-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Item & Description</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Work Description</label>
                                <textarea
                                    name="description" value={formData.description} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y h-24"
                                    placeholder="Enter details of service or product..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Financials */}
                    <section className="bg-gray-50 dark:bg-slate-800/20 px-6 py-8 md:px-8 md:py-10 border-y border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200 dark:border-slate-700">
                            <IndianRupee size={18} className="text-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Financial Details</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500">Price per Unit</label>
                                <input
                                    required type="number" name="total_price" value={formData.total_price} onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500">Quantity</label>
                                <input
                                    required type="number" name="quantity" value={formData.quantity} onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 dark:text-slate-500">GST Rate (%)</label>
                                <select
                                    name="GST" value={formData.GST} onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                    <option value="28">28%</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <div className="w-full md:w-80 space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span>₹{(parseFloat(formData.total_price || 0) * parseFloat(formData.quantity || 0)).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                                    <span>GST Amount ({formData.GST}%)</span>
                                    <span>₹{(formData.GST_Amount || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-slate-700">
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">Grand Total</span>
                                    <span className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">₹{(formData.total_Amount || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Payment */}
                    <section>
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <Calendar size={18} className="text-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-600 dark:text-slate-300">Payment Status</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-3">
                                {['Due', 'Paid', 'PartiallyPaid'].map((status) => (
                                    <button
                                        key={status} type="button"
                                        onClick={() => {
                                            const nextData = { ...formData, paymentStatus: status };
                                            const results = calculateFinancials(nextData);
                                            setFormData(prev => ({
                                                ...prev,
                                                paymentStatus: status,
                                                ...results
                                            }));
                                        }}
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
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 ml-1">Amount Received</label>
                                        <input
                                            required type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} max={formData.total_Amount}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-50 dark:focus:ring-emerald-900/20 focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center font-bold shadow-sm">!</div>
                                            <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">Balance Due</span>
                                        </div>
                                        <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                            ₹{(formData.balance_due || 0).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {formData.paymentStatus === 'Due' && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl flex items-center justify-between max-w-md">
                                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Full Balance Due</span>
                                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400">₹{formData.total_Amount.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            {formData.paymentStatus === 'Paid' && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center gap-3 max-w-md">
                                    <Check size={20} className="text-emerald-600" />
                                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Marked as Fully Paid</span>
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
