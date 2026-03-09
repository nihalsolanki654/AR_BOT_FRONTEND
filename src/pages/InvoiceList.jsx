import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Eye, X, MapPin, Receipt, Wallet, Check, Mail, FileText, Tag, Building2, Package, Percent, Calendar, ArrowRight, Clock, AlertCircle } from 'lucide-react';

const InvoiceList = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [paymentInput, setPaymentInput] = useState('');


    const [isLoading, setIsLoading] = useState(true);
    const [sendingEmailId, setSendingEmailId] = useState(null);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
    const [toast, setToast] = useState(null);
    const toastTimeoutRef = useRef(null);

    const showToast = useCallback((message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ message, type });
        toastTimeoutRef.current = setTimeout(() => setToast(null), 5000);
    }, []);

    const prepareMail = useCallback(async (invoice) => {
        if (sendingEmailId) return;
        setSendingEmailId(invoice._id);

        // Determine email type based on status
        const status = getPaymentStatus(invoice);
        let type = 'due';
        if (status === 'Overdue') type = 'overdue';
        if (status === 'Paid') type = 'paid';

        showToast(`Sending ${type} email to ${invoice.companyName}...`, "info");
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/${invoice._id}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            const data = await response.json();

            if (response.ok) {
                // Use the invoice object returned from backend to ensure data consistency
                const updatedInvoice = data.invoice;
                if (updatedInvoice) {
                    setInvoices(prev => prev.map(inv => inv._id === invoice._id ? {
                        ...inv,
                        lastEmailSentAt: updatedInvoice.lastEmailSentAt,
                        emailSentDate: updatedInvoice.emailSentDate
                    } : inv));
                } else {
                    // Fallback
                    const now = new Date().toISOString();
                    setInvoices(prev => prev.map(inv => inv._id === invoice._id ? { ...inv, lastEmailSentAt: now } : inv));
                }
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} email sent successfully!`, "success");
            } else {
                showToast(data.message || "Failed to send email", "error");
            }
        } catch (error) {
            console.error('Error sending email:', error);
            showToast("Error connecting to email service", "error");
        } finally {
            setSendingEmailId(null);
        }
    }, [showToast, sendingEmailId]);

    const fetchInvoices = async (page = 1, search = searchTerm, status = filterStatus) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices?page=${page}&limit=50&search=${encodeURIComponent(search)}&status=${status}`);
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.invoices);
                setPagination({
                    total: data.total,
                    pages: data.pages,
                    currentPage: data.currentPage
                });
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchInvoices(1);
    }, []);

    // Debounced search and filter fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices(1, searchTerm, filterStatus);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus]);

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
            if (due.getTime() === today.getTime()) return 'Due Today';
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
            case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'Due': return 'bg-amber-50 text-amber-700 border-amber-100/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            case 'PartiallyPaid': return 'bg-indigo-50 text-indigo-700 border-indigo-100/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
            case 'Overdue': return 'bg-rose-50 text-rose-700 border-rose-100/80 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
            default: return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    // Use invoices directly since filtering is now server-side
    const filteredInvoices = invoices;

    const calculateDaysLeft = (dueDate) => {
        const due = parseDate(dueDate);
        if (!due) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        // Formula: due - today (Negative means Overdue)
        return Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    };


    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto dark:bg-slate-950 min-h-screen transition-colors duration-500 font-sans selection:bg-slate-200 selection:text-slate-900">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-semibold max-w-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' :
                    toast.type === 'info' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800' :
                        'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                    }`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900' :
                        toast.type === 'info' ? 'bg-blue-100 dark:bg-blue-900' :
                            'bg-rose-100 dark:bg-rose-900'
                        }`}>
                        {toast.type === 'success' ? <Check size={11} className="text-emerald-600 dark:text-emerald-400" /> :
                            toast.type === 'info' ? <div className="w-2.5 h-2.5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" /> :
                                <X size={11} className="text-rose-600 dark:text-rose-400" />}
                    </div>
                    <span className="leading-snug">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 mt-0.5 shrink-0">
                        <X size={13} />
                    </button>
                </div>
            )}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Invoices</h1>
                    <p className="text-slate-500 text-sm font-medium">Finance ledger management</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/add-invoice')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg font-bold hover:bg-black dark:hover:bg-slate-700 transition-all text-sm shadow-md active:scale-95"
                    >
                        <Plus size={16} />
                        <span>New Invoice</span>
                    </button>
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-md">
                            <Calendar size={16} className="text-slate-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                {/* Filters */}
                <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900">
                    <div className="relative w-full xl:w-[400px] group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-slate-400 w-full text-sm outline-none dark:text-slate-200 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                        {['All', 'Paid', 'Due', 'Overdue', 'PartiallyPaid'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all duration-200 ${filterStatus === s
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                {s === 'PartiallyPaid' ? 'Partial' : s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {/* Scrollable Records List */}
                <div className="w-full overflow-x-auto custom-scrollbar bg-white dark:bg-slate-900 overflow-y-hidden">
                    <div className="min-w-max flex flex-col">
                        {/* Header */}
                        <div className="hidden lg:flex items-center px-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-md">
                            <div className="w-[120px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] sticky left-0 z-40 bg-slate-50 dark:bg-slate-800/90 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">Invoice No</div>
                            <div className="w-[220px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] sticky left-[120px] z-40 bg-slate-50 dark:bg-slate-800/90 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">Company Name</div>
                            <div className="w-[110px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Invoice Date</div>
                            <div className="w-[110px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Due Date</div>
                            <div className="w-[110px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Today Date</div>
                            <div className="w-[140px] shrink-0 px-4 py-4 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Status</div>
                            <div className="w-[90px] shrink-0 px-4 py-4 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Terms</div>
                            <div className="w-[240px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Description</div>
                            <div className="w-[120px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Unit Price</div>
                            <div className="w-[70px] shrink-0 px-4 py-4 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Qty</div>
                            <div className="w-[120px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Subtotal</div>
                            <div className="w-[70px] shrink-0 px-4 py-4 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">GST</div>
                            <div className="w-[120px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">GST Amt</div>
                            <div className="w-[130px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Total</div>
                            <div className="w-[130px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Pending</div>
                            <div className="w-[140px] shrink-0 px-4 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Email Sent</div>
                            <div className="w-[100px] shrink-0 px-4 py-4 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Sent Days</div>
                            <div className="w-[160px] shrink-0 px-4 py-4 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] pr-8">Actions</div>
                        </div>

                        {/* Body */}
                        <div className="relative flex flex-col divide-y divide-gray-100 dark:divide-slate-800">
                            {isLoading && (
                                <div className="absolute inset-0 z-40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col min-h-[300px]">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center px-4 py-3 border-b border-white/5 dark:border-slate-800/10 opacity-70">
                                            <div className="w-[120px] shrink-0 px-4 sticky left-0 z-20 bg-white dark:bg-slate-900 h-full flex items-center py-3 -my-3">
                                                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
                                            </div>
                                            <div className="w-[220px] shrink-0 px-4 sticky left-[120px] z-20 bg-white dark:bg-slate-900 h-full py-3 -my-3 flex flex-col justify-center gap-1.5">
                                                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
                                                <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
                                            </div>
                                            <div className="w-[110px] shrink-0 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div></div>
                                            <div className="w-[110px] shrink-0 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div></div>
                                            <div className="w-[110px] shrink-0 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div></div>
                                            <div className="w-[140px] shrink-0 px-4 flex justify-center"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-full animate-pulse"></div></div>
                                            <div className="w-[90px] shrink-0 px-4 flex justify-center"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div></div>
                                            <div className="w-[240px] flex-1 px-4"><div className="h-4 w-full bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div></div>
                                        </div>
                                    ))}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="flex flex-col items-center gap-3 bg-white/80 dark:bg-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md border border-slate-100 dark:border-slate-700/50">
                                            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest animate-pulse">Syncing Data...</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => {
                                const status = getPaymentStatus(invoice);
                                const daysLeft = calculateDaysLeft(invoice.dueDate);
                                return (
                                    <div key={invoice._id} className="group hover:bg-gray-50/30 dark:hover:bg-slate-800/20 transition-all duration-200 flex items-center px-4 py-3 border-b border-white/5 dark:border-slate-800/10">
                                        {/* Invoice # */}
                                        <div className="w-[120px] shrink-0 px-4 font-medium text-slate-1200 dark:text-slate-100 text-[12px] tracking-tight tabular-nums sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-[#f8fafc] dark:group-hover:bg-[#152033] shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] h-full flex items-center py-3 -my-3">
                                            {getInvoiceNumber(invoice)}
                                        </div>

                                        {/* Company */}
                                        <div className="w-[220px] shrink-0 px-4 sticky left-[120px] z-20 bg-white dark:bg-slate-900 group-hover:bg-[#f8fafc] dark:group-hover:bg-[#152033] shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] h-full py-3 -my-3 flex flex-col justify-center">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-[13px] whitespace-normal leading-tight line-clamp-2" title={invoice.companyName}>{invoice.companyName || 'N/A'}</div>
                                            {invoice.State && <div className="text-[10px] text-blue-500 dark:text-slate-400 mt-1 uppercase font-semibold tracking-wider">{invoice.State}</div>}
                                        </div>

                                        {/* Invoice Date */}
                                        <div className="w-[110px] shrink-0 px-4 text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                            {invoice.invoiceDate || '-'}
                                        </div>

                                        {/* Due Date */}
                                        <div className="w-[110px] shrink-0 px-4 text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                            {invoice.dueDate || '-'}
                                        </div>

                                        {/* Today Date */}
                                        <div className="w-[110px] shrink-0 px-4 text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                                        </div>

                                        {/* Status */}
                                        <div className="w-[140px] shrink-0 px-4 text-center flex items-center justify-center">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-widest shadow-none ${status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                (status === 'Due' || status === 'Due Today') ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                                    status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' :
                                                        'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                }`}>
                                                {status === 'PartiallyPaid' ? 'Partial' : (status === 'Due Today' ? 'Due' : status)}
                                            </span>
                                        </div>

                                        {/* Terms (Simple calculation) */}
                                        <div className="w-[90px] shrink-0 px-4 text-[13px] font-semibold whitespace-nowrap text-center">
                                            {status === 'Paid'
                                                ? <span className="text-slate-300">-</span>
                                                : <span className={daysLeft < 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}>
                                                    {daysLeft === 0 ? 'Today' : daysLeft}
                                                </span>
                                            }
                                        </div>

                                        {/* Description */}
                                        <div className="w-[240px] shrink-0 px-4">
                                            <div className="text-[12px] text-slate-600 dark:text-slate-300 line-clamp-2 font-medium leading-relaxed" title={invoice.description || ''}>
                                                {invoice.description || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Unit Price */}
                                        <div className="w-[120px] shrink-0 px-4 text-[13px] text-slate-600 dark:text-slate-300 font-normal whitespace-nowrap tabular-nums">
                                            ₹{parseFloat(invoice.total_price || 0).toLocaleString('en-IN')}
                                        </div>

                                        {/* Qty */}
                                        <div className="w-[70px] shrink-0 px-4 text-center text-[13px] text-slate-600 dark:text-slate-300 font-normal tabular-nums">
                                            {invoice.quantity ?? '-'}
                                        </div>

                                        {/* Subtotal (Unit * Qty) */}
                                        <div className="w-[120px] shrink-0 px-4 text-[13px] text-slate-600 dark:text-slate-300 font-normal whitespace-nowrap tabular-nums">
                                            ₹{parseFloat(invoice.subtotal || (invoice.total_price * (invoice.quantity || 1)) || 0).toLocaleString('en-IN')}
                                        </div>

                                        {/* GST % */}
                                        <div className="w-[70px] shrink-0 px-4 text-center text-[13px] text-slate-600 dark:text-slate-300 font-normal tabular-nums">
                                            {invoice.GST ? `${invoice.GST}%` : '-'}
                                        </div>

                                        {/* GST Amt */}
                                        <div className="w-[120px] shrink-0 px-4 text-[13px] text-slate-600 dark:text-slate-300 font-normal whitespace-nowrap tabular-nums">
                                            ₹{parseFloat(invoice.GST_Amount || 0).toLocaleString('en-IN')}
                                        </div>

                                        {/* Total Amount */}
                                        <div className="w-[130px] shrink-0 px-4 text-[13px] text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap tabular-nums">
                                            ₹{parseFloat(invoice.total_Amount || 0).toLocaleString('en-IN')}
                                        </div>

                                        {/* Balance Due (Pending) */}
                                        <div className="w-[130px] shrink-0 px-4 text-[13px] font-semibold whitespace-nowrap tabular-nums">
                                            {parseFloat(invoice.balance_due || 0) === 0 ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 uppercase text-[11px] tracking-wider">Paid</span>
                                            ) : (
                                                <span className="text-red-600 dark:text-red-400">₹{parseFloat(invoice.balance_due || 0).toLocaleString('en-IN')}</span>
                                            )}
                                        </div>

                                        {/* Email Sent Date */}
                                        <div className="w-[140px] shrink-0 px-4 text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                            {invoice.emailSentDate || (invoice.lastEmailSentAt ? new Date(invoice.lastEmailSentAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-')}
                                        </div>

                                        {/* Sent Days Count */}
                                        <div className="w-[100px] shrink-0 px-4 text-center text-[13px] text-slate-600 dark:text-slate-300 font-semibold tabular-nums">
                                            {(() => {
                                                if (!invoice.lastEmailSentAt || status === 'Paid') return '-';
                                                const sentDate = new Date(invoice.lastEmailSentAt); sentDate.setHours(0, 0, 0, 0);
                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                const diffDays = Math.round((today.getTime() - sentDate.getTime()) / (1000 * 3600 * 24));
                                                return diffDays === 0 ? 'Today' : diffDays;
                                            })()}
                                        </div>

                                        {/* Actions */}
                                        <div className="w-[160px] shrink-0 px-4 pr-6 pl-6">
                                            <div className="flex items-center justify-end gap-2.5">
                                                {(() => {
                                                    const lastSent = invoice.lastEmailSentAt ? new Date(invoice.lastEmailSentAt) : null;
                                                    const today = new Date(); today.setHours(0, 0, 0, 0);
                                                    const diffDays = lastSent ? Math.round((today.getTime() - lastSent.setHours(0, 0, 0, 0)) / (1000 * 3600 * 24)) : null;

                                                    const isPaid = status === 'Paid';
                                                    const isDueOrOverdue = status === 'Due' || status === 'Overdue' || status === 'Due Today' || status === 'PartiallyPaid';

                                                    let isDisabled = false;
                                                    let tooltip = "Send Email";

                                                    if (isPaid && lastSent) {
                                                        isDisabled = true;
                                                        tooltip = "Email already sent for Paid invoice";
                                                    } else if (isDueOrOverdue && lastSent && diffDays < 1) {
                                                        isDisabled = true;
                                                        tooltip = `Wait ${1 - diffDays} more days to resend`;
                                                    }

                                                    return (
                                                        <>
                                                            <button onClick={() => { setSelectedInvoice(invoice); setShowViewModal(true); }}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" title="View Details">
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => prepareMail(invoice)}
                                                                disabled={sendingEmailId === invoice._id || isDisabled}
                                                                className={`p-2 rounded-xl transition-all shadow-sm border ${sendingEmailId === invoice._id
                                                                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 border-blue-100 cursor-wait'
                                                                    : isDisabled
                                                                        ? 'text-slate-300 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                                                                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                                                    }`}
                                                                title={sendingEmailId === invoice._id ? "Sending..." : tooltip}>
                                                                {sendingEmailId === invoice._id ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Mail size={16} />}
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                                <button onClick={() => handleDelete(invoice._id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="py-20 text-center text-gray-400 bg-white dark:bg-slate-900">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                            <Search size={32} className="opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">No invoices found matching your criteria</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                    <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                            Showing <span className="text-slate-900 dark:text-white">Page {pagination.currentPage}</span> of <span className="text-slate-900 dark:text-white">{pagination.pages}</span>
                            <span className="mx-2 opacity-30 text-slate-300">|</span>
                            <span className="tabular-nums text-slate-400">{pagination.total} total records</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.currentPage === 1}
                                onClick={() => fetchInvoices(pagination.currentPage - 1)}
                                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all border ${pagination.currentPage === 1
                                    ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                            >
                                Previous
                            </button>
                            <button
                                disabled={pagination.currentPage === pagination.pages}
                                onClick={() => fetchInvoices(pagination.currentPage + 1)}
                                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all border ${pagination.currentPage === pagination.pages
                                    ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

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
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
                            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">

                                {/* Top Accent Bar */}
                                <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

                                {/* Premium Header */}
                                <div className="px-8 py-6 bg-white dark:bg-slate-950 flex items-start justify-between shrink-0 relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                                    {/* Subtle Background Pattern/Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-500/10 to-transparent pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></div>
                                                {status === 'PartiallyPaid' ? 'Partial' : (status === 'Due Today' ? 'Due' : status)}
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">Transaction Ledger</p>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                            {getInvoiceNumber(inv)}
                                        </h2>
                                    </div>

                                    <button onClick={() => setShowViewModal(false)} className="relative z-10 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all border border-slate-200 dark:border-slate-700">
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="overflow-y-auto p-6 flex-1 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">

                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Left Column: Customer & Details */}
                                        <div className="flex-1 space-y-6">

                                            {/* Customer Card */}
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Billed To</h3>
                                                </div>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{inv.companyName || 'N/A'}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                                                    {inv.State && (
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                            <MapPin size={12} className="text-slate-400" /> {inv.State}
                                                        </div>
                                                    )}
                                                    {inv.Terms && (
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                            <Clock size={12} className="text-slate-400" /> Net {inv.Terms}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                                                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tabular-nums">{inv.invoiceDate || '-'}</p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/50 relative overflow-hidden">
                                                    {daysLeft !== null && daysLeft < 0 && (
                                                        <div className="absolute right-0 top-0 w-8 h-8 bg-red-500/10 rounded-bl-xl flex items-center justify-center">
                                                            <AlertCircle size={14} className="text-red-500" />
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                                                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tabular-nums">{inv.dueDate || '-'}</p>
                                                </div>
                                            </div>

                                            {/* Work Description */}
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                                            <FileText size={16} />
                                                        </div>
                                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Description</h3>
                                                    </div>
                                                    <div className="px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                                        QTY: {inv.quantity ?? 1}
                                                    </div>
                                                </div>
                                                <div className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {inv.description || "No description provided."}
                                                </div>
                                            </div>

                                        </div>

                                        {/* Right Column: Financials & Action */}
                                        <div className="w-full md:w-64 flex flex-col gap-6 shrink-0">

                                            {/* Amount Due Big Banner */}
                                            <div className={`rounded-2xl p-5 text-center border shadow-sm relative overflow-hidden ${status === 'Paid'
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30'
                                                : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/50'
                                                }`}>
                                                {status === 'Paid' && <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 pointer-events-none"></div>}
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 relative z-10">Amount Due</p>
                                                <p className={`text-3xl font-black tabular-nums tracking-tight relative z-10 ${status === 'Paid'
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                    ₹{balanceDue.toLocaleString('en-IN')}
                                                </p>
                                                {status !== 'Paid' && daysLeft !== null && (
                                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border max-w-full">
                                                        {daysLeft < 0 ? (
                                                            <span className="text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">Overdue by {Math.abs(daysLeft)}d</span>
                                                        ) : daysLeft === 0 ? (
                                                            <span className="text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">Due Today</span>
                                                        ) : (
                                                            <span className="text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{daysLeft}d Remaining</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Financial Breakdown */}
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50 flex-1 flex flex-col">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Breakdown</h3>
                                                <div className="space-y-3 mt-auto">
                                                    <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                                                        <span>Subtotal</span>
                                                        <span className="text-slate-800 dark:text-slate-200 tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                                                        <span>GST ({gstRate})</span>
                                                        <span className="text-slate-800 dark:text-slate-200 tabular-nums">₹{gstAmt.toLocaleString('en-IN')}</span>
                                                    </div>

                                                    {paidAmt > 0 && (
                                                        <div className="flex justify-between items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                            <span>Paid</span>
                                                            <span className="tabular-nums">- ₹{paidAmt.toLocaleString('en-IN')}</span>
                                                        </div>
                                                    )}

                                                    <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Total</span>
                                                        <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">₹{totalAmt.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Payment Action */}
                                            {status !== 'Paid' && (
                                                <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-800">
                                                    <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <Wallet size={12} className="text-emerald-500 dark:text-emerald-400" /> Log Payment
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium text-sm">₹</span>
                                                            <input
                                                                type="number"
                                                                placeholder="Amount"
                                                                value={paymentInput}
                                                                onChange={(e) => setPaymentInput(e.target.value)}
                                                                className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600"
                                                            />
                                                        </div>
                                                        <button onClick={() => handlePartialPayment(inv)}
                                                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98] text-xs">
                                                            Record
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Footer Actions */}
                                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                                    {status !== 'Paid' && (
                                        <button onClick={() => handleMarkAsPaid(inv)}
                                            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-xs shadow-md">
                                            <Check size={14} /> Mark Full Paid
                                        </button>
                                    )}
                                    <div className="flex-1"></div>
                                    <button onClick={() => window.print()}
                                        className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs border border-slate-200 dark:border-slate-700">
                                        <Receipt size={14} /> Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

            </div>
        </div>
    );
};

export default InvoiceList;
