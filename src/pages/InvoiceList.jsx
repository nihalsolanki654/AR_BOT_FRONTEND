import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Trash2, Eye, X, MapPin, Receipt, Wallet, Check, Mail, FileText, Tag, Building2, Package, Percent } from 'lucide-react';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [paymentInput, setPaymentInput] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`);
                if (response.ok) {
                    const data = await response.json();
                    setInvoices(data);
                }
            } catch (error) {
                console.error('Error fetching invoices:', error);
            }
        };
        fetchInvoices();
    }, []);

    // Helper: get invoice number regardless of old/new field name
    const getInvoiceNumber = (inv) => inv.invoiceNumber || inv.invoice_number || '-';

    // Helper: parse DD-MM-YYYY or any date string safely
    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        if (typeof dateStr === 'string' && dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
            const [dd, mm, yyyy] = dateStr.split('-');
            const d = new Date(`${yyyy}-${mm}-${dd}`);
            return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    };

    // Derive payment status from balance_due and dueDate
    const getPaymentStatus = (invoice) => {
        const balance = parseFloat(invoice.balance_due || 0);
        if (balance <= 0) return 'Paid';

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const due = parseDate(invoice.dueDate);
        if (due) {
            due.setHours(0, 0, 0, 0);
            if (due < today) return 'Overdue';
        }

        if (invoice.paymentStatus) return invoice.paymentStatus;

        const total = parseFloat(invoice.total_Amount || 0);
        if (balance >= total) return 'Due';
        return 'PartiallyPaid';
    };


    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/${id}`, { method: 'DELETE' });
                if (res.ok) setInvoices(invoices.filter(inv => inv._id !== id));
            } catch (err) { console.error('Error deleting invoice:', err); }
        }
    };

    const handleMarkAsPaid = async (invoice) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/${invoice._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    balance_due: 0,
                    paymentStatus: 'Paid'
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setInvoices(invoices.map(inv => inv._id === invoice._id ? updated : inv));
                setSelectedInvoice(updated);
            }
        } catch (err) { console.error('Error marking as paid:', err); }
    };

    const handlePartialPayment = async (invoice) => {
        const amount = parseFloat(paymentInput);
        if (isNaN(amount) || amount <= 0) { alert('Please enter a valid amount'); return; }
        const currentBalance = parseFloat(invoice.balance_due || 0);
        const newBalance = currentBalance - amount;
        if (newBalance < 0) { alert(`Amount cannot exceed balance due (₹${currentBalance.toFixed(2)})`); return; }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/${invoice._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    balance_due: newBalance,
                    paymentStatus: newBalance <= 0 ? 'Paid' : 'PartiallyPaid'
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setInvoices(invoices.map(inv => inv._id === invoice._id ? updated : inv));
                setSelectedInvoice(updated);
                setPaymentInput('');
            }
        } catch (err) { console.error('Error recording payment:', err); }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'Due': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'PartiallyPaid': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        const status = getPaymentStatus(invoice);
        const num = getInvoiceNumber(invoice).toLowerCase();
        const matchesSearch = num.includes(searchTerm.toLowerCase()) ||
            (invoice.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch && (filterStatus === 'All' || status === filterStatus);
    });

    const calculateDaysLeft = (dueDate) => {
        const due = parseDate(dueDate);
        if (!due) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        // Formula: due - today (Negative means Overdue)
        return Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    };


    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto dark:bg-slate-950 min-h-screen transition-colors duration-300">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Invoices</h1>
                <p className="text-gray-500 mt-1">Manage and track all your invoices</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-slate-800/20">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search invoice # or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 w-full text-sm outline-none dark:text-slate-200"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <Filter size={18} className="text-gray-400 shrink-0" />
                        {['All', 'Paid', 'Due', 'Overdue', 'PartiallyPaid'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterStatus === s
                                    ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-slate-600'
                                    : 'text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
                                {s === 'PartiallyPaid' ? 'Partially Paid' : s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-500 text-sm font-bold">
                            <tr>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Invoice #</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Company</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Invoice Date</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Due Date</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Terms</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Today</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Status</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Days Left</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Description</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Qty</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Unit Price</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">GST %</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">GST Amt</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Total Amount</th>
                                <th className="px-5 py-4 text-left whitespace-nowrap">Balance Due</th>
                                <th className="px-5 py-4 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => {
                                const status = getPaymentStatus(invoice);
                                const daysLeft = calculateDaysLeft(invoice.dueDate);
                                return (
                                    <tr key={invoice._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-4 font-bold text-gray-900 dark:text-slate-100 whitespace-nowrap text-base">{getInvoiceNumber(invoice)}</td>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-gray-900 dark:text-slate-100 whitespace-nowrap text-base">{invoice.companyName || 'N/A'}</div>
                                            <div className="text-sm text-gray-400 whitespace-nowrap">{invoice.State || ''}</div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-slate-300 text-base whitespace-nowrap font-medium">{invoice.invoiceDate || '-'}</td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-slate-300 text-base whitespace-nowrap font-medium">{invoice.dueDate || '-'}</td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-slate-300 text-base whitespace-nowrap font-medium">{invoice.Terms || '-'}</td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-slate-300 text-base whitespace-nowrap font-medium">
                                            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
                                                {status === 'PartiallyPaid' ? 'Partially Paid' : status}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-base whitespace-nowrap font-bold">
                                            {status === 'Paid'
                                                ? <span className="text-gray-400">-</span>
                                                : daysLeft !== null
                                                    ? <span className={daysLeft < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>
                                                        {daysLeft < 0 ? `${daysLeft} days` : `${daysLeft} days`}
                                                    </span>
                                                    : '-'}
                                        </td>

                                        <td className="px-5 py-4 text-gray-700 dark:text-slate-300 text-base max-w-[200px]">
                                            <div className="max-h-16 overflow-y-auto font-medium scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                                                {invoice.description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-slate-300 text-base text-center whitespace-nowrap font-medium">{invoice.quantity ?? '-'}</td>
                                        <td className="px-5 py-4 text-gray-800 dark:text-slate-200 text-base whitespace-nowrap font-bold">₹{parseFloat(invoice.total_price || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-5 py-4 text-gray-700 dark:text-slate-300 text-base whitespace-nowrap font-medium">
                                            {invoice.GST ? `${invoice.GST}%` : '-'}
                                        </td>
                                        <td className="px-5 py-4 text-gray-800 dark:text-slate-200 text-base whitespace-nowrap font-bold">₹{parseFloat(invoice.GST_Amount || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-5 py-4 font-black text-gray-900 dark:text-white text-lg whitespace-nowrap">₹{parseFloat(invoice.total_Amount || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-5 py-4 font-black text-indigo-600 dark:text-indigo-400 text-lg whitespace-nowrap">₹{parseFloat(invoice.balance_due || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setSelectedInvoice(invoice); setShowViewModal(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all" title="View">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => alert('Send Mail coming soon!')}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-slate-800 rounded-lg transition-all" title="Email">
                                                    <Mail size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(invoice._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-all" title="Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (

                                <tr><td colSpan="15" className="px-6 py-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2"><Search size={32} className="opacity-20" /><p>No invoices found</p></div>
                                </td></tr>
                            )}

                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── View Modal ── */}
            {showViewModal && selectedInvoice && (() => {
                const inv = selectedInvoice;
                const status = getPaymentStatus(inv);
                const totalAmt = parseFloat(inv.total_Amount || 0);
                const balanceDue = parseFloat(inv.balance_due || 0);
                const paidAmt = totalAmt - balanceDue;
                const unitPrice = parseFloat(inv.total_price || 0);
                const quantity = inv.quantity || 1;
                const subtotal = unitPrice * quantity;
                const gstAmt = parseFloat(inv.GST_Amount || 0);
                const gstRate = inv.GST ? `${inv.GST}%` : '18%';
                const daysLeft = calculateDaysLeft(inv.dueDate);
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                        <Receipt size={22} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{getInvoiceNumber(inv)}</h2>
                                        <p className="text-xs text-slate-500">Invoice Details</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto p-6 space-y-4 flex-1">

                                {/* Status / Dates row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Status</p>
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(status)}`}>
                                            {status === 'PartiallyPaid' ? 'Partially Paid' : status}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Invoice Date</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{inv.invoiceDate || '-'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Due Date</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{inv.dueDate || '-'}</p>
                                    </div>
                                </div>

                                {/* Overdue / Days remaining alert */}
                                {status !== 'Paid' && daysLeft !== null && (
                                    <div className={`rounded-xl p-3 border-l-4 ${daysLeft < 0 ? 'bg-red-50 dark:bg-red-500/10 border-red-500' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-500'}`}>
                                        <p className={`text-base font-black ${daysLeft < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                            {daysLeft < 0 ? `${Math.abs(daysLeft)} Days Overdue` : `${Math.abs(daysLeft)} Days Remaining`}
                                        </p>
                                    </div>
                                )}

                                {/* Company & Terms */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Company Information</p>
                                    <div className="flex items-start gap-3 mb-3">
                                        <Building2 size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{inv.companyName || 'N/A'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {inv.State && (
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <MapPin size={13} className="shrink-0" />
                                                <span>{inv.State}</span>
                                            </div>
                                        )}
                                        {inv.Terms && (
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Tag size={13} className="shrink-0" />
                                                <span>Terms: <span className="font-semibold text-slate-800 dark:text-slate-200">{inv.Terms}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Item / Description */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Item Details</p>
                                    {inv.description && (
                                        <div className="flex items-start gap-2 mb-2">
                                            <FileText size={14} className="text-slate-400 mt-1 shrink-0" />
                                            <div className="max-h-32 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 pr-2">
                                                {inv.description}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <Package size={13} className="shrink-0" />
                                        <span>Quantity: <span className="font-bold text-slate-800 dark:text-slate-200">{inv.quantity ?? 1}</span></span>
                                    </div>
                                </div>

                                {/* Financial Breakdown */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Financial Breakdown</p>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Total Price (Before GST)</span>
                                            <span className="font-bold text-slate-800 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                <Percent size={12} /> GST ({gstRate})
                                            </span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{gstAmt.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5 flex justify-between items-center">
                                            <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                                            <span className="text-xl font-black text-blue-600 dark:text-blue-400">₹{totalAmt.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Breakdown (Partially Paid / Paid) */}
                                {(status === 'PartiallyPaid' || status === 'Paid') && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border-2 border-emerald-200 dark:border-emerald-500/30">
                                            <p className="text-xs font-bold text-emerald-600 mb-1">Amount Paid</p>
                                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">₹{paidAmt.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-3 border-2 border-orange-200 dark:border-orange-500/30">
                                            <p className="text-xs font-bold text-orange-600 mb-1">Balance Due</p>
                                            <p className="text-xl font-black text-orange-700 dark:text-orange-300">₹{balanceDue.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Paid badge */}
                                {status === 'Paid' && (
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 flex items-center gap-3 border-2 border-emerald-200 dark:border-emerald-500/30">
                                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                                            <Check size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-900 dark:text-emerald-100">Payment Completed</p>
                                            <p className="text-xs text-emerald-600">Full amount received</p>
                                        </div>
                                    </div>
                                )}

                                {/* Record Payment */}
                                {status !== 'Paid' && (
                                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-500/30">
                                        <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                            <Wallet size={15} /> Record Payment
                                        </h3>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    value={paymentInput}
                                                    onChange={(e) => setPaymentInput(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white text-sm"
                                                />
                                            </div>
                                            <button onClick={() => handlePartialPayment(inv)}
                                                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm">
                                                Add
                                            </button>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">Balance Due: ₹{balanceDue.toLocaleString('en-IN')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
                                {status !== 'Paid' && (
                                    <button onClick={() => handleMarkAsPaid(inv)}
                                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm">
                                        <Check size={16} /> Mark as Paid
                                    </button>
                                )}
                                <button onClick={() => window.print()}
                                    className="px-5 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 text-sm">
                                    <Receipt size={15} /> Print
                                </button>
                                <button onClick={() => setShowViewModal(false)}
                                    className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-700 transition-all text-sm">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default InvoiceList;
