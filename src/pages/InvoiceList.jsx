import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Eye, X, MapPin, Receipt, Wallet, Check, Mail, FileText, Tag, Building2, Package, Percent, Calendar, ArrowRight } from 'lucide-react';

const InvoiceList = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [paymentInput, setPaymentInput] = useState('');
    const headerScrollRef = useRef(null);

    const handleRowScroll = (e) => {
        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = e.target.scrollLeft;
        }
    };

    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
    const [toast, setToast] = useState(null);
    const [sendingMailId, setSendingMailId] = useState(null);
    const [showMailModal, setShowMailModal] = useState(false);
    const [mailRecipients, setMailRecipients] = useState({ to: [], cc: [] });
    const [mailInvoice, setMailInvoice] = useState(null);
    const [fetchingRecipientsId, setFetchingRecipientsId] = useState(null);
    const [previewHtml, setPreviewHtml] = useState('');

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const prepareMail = useCallback(async (invoice) => {
        setFetchingRecipientsId(invoice._id);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            // 1. Fetch Recipients
            const recRes = await fetch(`${import.meta.env.VITE_API_URL}/api/customer-emails/by-company/${encodeURIComponent(invoice.companyName)}`);
            const recData = await recRes.json();
            if (!recRes.ok) throw new Error(recData.message || 'Could not find recipients for this company.');

            // 2. Fetch HTML Preview
            const uName = user.name || '';
            const uEmail = user.email || '';
            const uPhone = user.phone || '';

            const prevRes = await fetch(`${import.meta.env.VITE_API_URL}/api/mail/preview/${invoice._id}?senderName=${encodeURIComponent(uName)}&fromEmail=${encodeURIComponent(uEmail)}&senderPhone=${encodeURIComponent(uPhone)}`);
            const prevData = await prevRes.json();
            if (!prevRes.ok) throw new Error(prevData.message || 'Failed to generate email preview.');

            setMailRecipients({
                to: recData.toEmails?.filter(Boolean) || [],
                cc: recData.ccEmails?.filter(Boolean) || []
            });

            // Inject public image paths for front-end preview since CID won't work in browser directly
            let browserHtml = prevData.html;
            browserHtml = browserHtml.replace('cid:logo1', '/image/Picture1.png');
            browserHtml = browserHtml.replace('cid:logo2', '/image/Picture2.png');

            setPreviewHtml(browserHtml);
            setMailInvoice(invoice);
            setShowMailModal(true);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setFetchingRecipientsId(null);
        }
    }, [showToast]);

    const sendMail = useCallback(async () => {
        if (!mailInvoice) return;
        setSendingMailId(mailInvoice._id);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const uName = user.name || '';
            const uEmail = user.email || '';
            const uPhone = user.phone || '';

            // Add AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mail/send-invoice/${mailInvoice._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderName: uName,
                    fromEmail: uEmail,
                    senderPhone: uPhone
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send email.');
            showToast(`✓ ${data.message}`, 'success');
            setShowMailModal(false);
            setMailInvoice(null);
        } catch (err) {
            console.error('Send mail error:', err);
            if (err.name === 'AbortError') {
                showToast('Request timed out. The server is taking too long to respond.', 'error');
            } else {
                showToast(err.message || 'An unexpected error occurred.', 'error');
            }
        } finally {
            setSendingMailId(null);
        }
    }, [mailInvoice, showToast]);

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
        <div className="p-6 md:p-10 max-w-7xl mx-auto dark:bg-slate-950 min-h-screen transition-colors duration-500 font-sans selection:bg-slate-200 selection:text-slate-900">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-semibold max-w-sm transition-all duration-300 ${toast.type === 'success'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                    }`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-rose-100 dark:bg-rose-900'
                        }`}>
                        {toast.type === 'success'
                            ? <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                            : <X size={11} className="text-rose-600 dark:text-rose-400" />}
                    </div>
                    <span className="leading-snug">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 mt-0.5 shrink-0">
                        <X size={13} />
                    </button>
                </div>
            )}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Invoices</h1>
                    <p className="text-slate-500 text-sm font-medium">Finance ledger management</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/add-invoice')}
                        className="flex items-center gap-2.5 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold hover:bg-black dark:hover:bg-slate-700 transition-all text-sm shadow-md active:scale-95"
                    >
                        <Plus size={18} />
                        <span>New Invoice</span>
                    </button>
                    <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Calendar size={18} className="text-slate-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                {/* Filters */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row gap-6 justify-between items-center bg-white dark:bg-slate-900">
                    <div className="relative w-full xl:w-[450px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-slate-400 w-full text-[13px] outline-none dark:text-slate-200 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                        {['All', 'Paid', 'Due', 'Overdue', 'PartiallyPaid'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${filterStatus === s
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                                {s === 'PartiallyPaid' ? 'Partial' : s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {/* Scrollable Records List */}
                <div className="flex flex-col">
                    {/* Header - Fixed structure to match records */}
                    <div className="hidden lg:block bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-md">
                        <div ref={headerScrollRef} className="overflow-x-auto scrollbar-hide">
                            <div className="flex items-center min-w-max px-3">
                                <div className="w-[120px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Invoice No</div>
                                <div className="w-[220px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Company Name</div>
                                <div className="w-[110px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Invoice Date</div>
                                <div className="w-[110px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Due Date</div>
                                <div className="w-[110px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Today Date</div>
                                <div className="w-[180px] shrink-0 px-5 py-5 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Status</div>
                                <div className="w-[100px] shrink-0 px-5 py-5 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Terms</div>
                                <div className="w-[220px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Description</div>
                                <div className="w-[120px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Unit Price</div>
                                <div className="w-[70px] shrink-0 px-5 py-5 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Qty</div>
                                <div className="w-[120px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Subtotal</div>
                                <div className="w-[70px] shrink-0 px-5 py-5 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">GST</div>
                                <div className="w-[120px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">GST Amt</div>
                                <div className="w-[130px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Total</div>
                                <div className="w-[130px] shrink-0 px-5 py-5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Balance</div>
                                <div className="w-[180px] shrink-0 px-5 py-5 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] pr-12">Actions</div>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="relative divide-y divide-gray-100 dark:divide-slate-800">
                        {isLoading && (
                            <div className="absolute inset-0 z-40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center min-h-[300px]">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest animate-pulse">Syncing Data...</p>
                                </div>
                            </div>
                        )}
                        {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => {
                            const status = getPaymentStatus(invoice);
                            const daysLeft = calculateDaysLeft(invoice.dueDate);
                            return (
                                <div key={invoice._id}
                                    onMouseEnter={(e) => {
                                        const scrollContainer = e.currentTarget.querySelector('.overflow-x-auto');
                                        if (scrollContainer && headerScrollRef.current) {
                                            headerScrollRef.current.scrollLeft = scrollContainer.scrollLeft;
                                        }
                                    }}
                                    className="group hover:bg-gray-50/30 dark:hover:bg-slate-800/20 transition-all duration-200">
                                    <div className="overflow-x-auto scrollbar-hide group-hover:scrollbar-default scroll-smooth"
                                        onScroll={handleRowScroll}>
                                        <div className="flex items-center min-w-max px-3 py-4">
                                            {/* Invoice # */}
                                            <div className="w-[120px] shrink-0 px-5 font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight tabular-nums">
                                                {getInvoiceNumber(invoice)}
                                            </div>

                                            {/* Company */}
                                            <div className="w-[220px] shrink-0 px-5">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm whitespace-normal leading-tight" title={invoice.companyName}>{invoice.companyName || 'N/A'}</div>
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{invoice.State || ''}</div>
                                            </div>

                                            {/* Invoice Date */}
                                            <div className="w-[110px] shrink-0 px-5 text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                                {invoice.invoiceDate || '-'}
                                            </div>

                                            {/* Due Date */}
                                            <div className="w-[110px] shrink-0 px-5 text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                                {invoice.dueDate || '-'}
                                            </div>

                                            {/* Today Date */}
                                            <div className="w-[110px] shrink-0 px-5 text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                                            </div>

                                            {/* Status */}
                                            <div className="w-[180px] shrink-0 px-5 text-center flex items-center justify-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-sm ${status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                    status === 'Due' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                                        status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' :
                                                            status === 'Due Today' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                                                'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                    }`}>
                                                    {status === 'PartiallyPaid' ? 'Partial' : status === 'Due Today' ? 'Today' : status}
                                                </span>
                                            </div>


                                            {/* Terms (Simple calculation) */}
                                            <div className="w-[100px] shrink-0 px-5 text-[13px] font-medium whitespace-nowrap text-center">
                                                {status === 'Paid'
                                                    ? <span className="text-slate-300">-</span>
                                                    : <span className={daysLeft < 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}>
                                                        {daysLeft}
                                                    </span>
                                                }
                                            </div>

                                            {/* Description */}
                                            <div className="w-[220px] shrink-0 px-5">
                                                <div className="text-[13px] text-slate-600 dark:text-slate-300 line-clamp-1 font-medium leading-relaxed" title={invoice.description || ''}>
                                                    {invoice.description || 'N/A'}
                                                </div>
                                            </div>

                                            {/* Unit Price */}
                                            <div className="w-[120px] shrink-0 px-5 text-[13px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap tabular-nums">
                                                ₹{parseFloat(invoice.total_price || 0).toLocaleString('en-IN')}
                                            </div>

                                            {/* Qty */}
                                            <div className="w-[70px] shrink-0 px-5 text-center text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                                {invoice.quantity ?? '-'}
                                            </div>

                                            {/* Subtotal (Unit * Qty) */}
                                            <div className="w-[120px] shrink-0 px-5 text-[13px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap tabular-nums">
                                                ₹{parseFloat(invoice.subtotal || (invoice.total_price * (invoice.quantity || 1)) || 0).toLocaleString('en-IN')}
                                            </div>

                                            {/* GST % */}
                                            <div className="w-[70px] shrink-0 px-5 text-center text-[13px] text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                                                {invoice.GST ? `${invoice.GST}%` : '-'}
                                            </div>

                                            {/* GST Amt */}
                                            <div className="w-[120px] shrink-0 px-5 text-[13px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap tabular-nums">
                                                ₹{parseFloat(invoice.GST_Amount || 0).toLocaleString('en-IN')}
                                            </div>

                                            {/* Total Amount */}
                                            <div className="w-[130px] shrink-0 px-5 text-[13px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap tabular-nums">
                                                ₹{parseFloat(invoice.total_Amount || 0).toLocaleString('en-IN')}
                                            </div>

                                            {/* Balance Due */}
                                            <div className="w-[130px] shrink-0 px-5 text-[13px] text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap tabular-nums">
                                                ₹{parseFloat(invoice.balance_due || 0).toLocaleString('en-IN')}
                                            </div>


                                            {/* Actions */}
                                            <div className="w-[180px] shrink-0 px-5 pr-12 pl-10">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    <button onClick={() => { setSelectedInvoice(invoice); setShowViewModal(true); }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" title="View Details">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => prepareMail(invoice)}
                                                        disabled={sendingMailId === invoice._id || fetchingRecipientsId === invoice._id}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Send Email">
                                                        {fetchingRecipientsId === invoice._id
                                                            ? <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                                                            : <Mail size={16} />}
                                                    </button>
                                                    <button onClick={() => handleDelete(invoice._id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
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
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
                            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                                {/* Header */}
                                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                                            <Receipt size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{getInvoiceNumber(inv)}</h2>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Transaction Ledger</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="overflow-y-auto p-6 space-y-4 flex-1">

                                    {/* Status / Dates row */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Status</p>
                                            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 uppercase">{status === 'PartiallyPaid' ? 'Partial' : status}</p>
                                        </div>
                                        <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Date</p>
                                            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 tabular-nums">{inv.invoiceDate || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Due</p>
                                            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 tabular-nums">{inv.dueDate || '-'}</p>
                                        </div>
                                    </div>

                                    {/* Overdue Alert */}
                                    {status !== 'Paid' && daysLeft !== null && (
                                        <div className={`rounded-xl p-3 border ${daysLeft < 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100' : 'bg-slate-50 dark:bg-slate-800 border-slate-100'}`}>
                                            <p className={`text-sm font-bold ${daysLeft < 0 ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {daysLeft < 0 ? `${Math.abs(daysLeft)} Days Overdue` : (daysLeft === 0 ? 'Due Today' : `${Math.abs(daysLeft)} Days Remaining`)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Company */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Customer</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{inv.companyName || 'N/A'}</p>
                                        <div className="flex gap-4 mt-2">
                                            {inv.State && <span className="text-xs text-slate-500">{inv.State}</span>}
                                            {inv.Terms && <span className="text-xs text-slate-500">Terms: <span className="font-bold text-slate-700 dark:text-slate-300">{inv.Terms} Days</span></span>}
                                        </div>
                                    </div>

                                    {/* Work Description Detailed View */}
                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Work Description</h3>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                                <Package size={12} />
                                                Qty: {inv.quantity ?? 1}
                                            </div>
                                        </div>
                                        <div className="relative pl-2 border-l-2 border-blue-500/20 dark:border-blue-500/10">
                                            <div className="max-h-48 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 leading-7 font-medium scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 pr-4 whitespace-pre-wrap">
                                                {inv.description || "No description provided for this invoice."}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Breakdown */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[13px] text-slate-500">
                                                <span>Subtotal</span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between text-[13px] text-slate-500">
                                                <span>GST ({gstRate})</span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">₹{gstAmt.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-slate-900 dark:text-white">
                                                <span className="text-xs font-bold uppercase tracking-widest">Grand Total</span>
                                                <span className="text-2xl font-bold tabular-nums">₹{totalAmt.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Status Info */}
                                    {(status === 'PartiallyPaid' || status === 'Paid') && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Settled</p>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">₹{paidAmt.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Balance</p>
                                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">₹{balanceDue.toLocaleString('en-IN')}</p>
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
                                            <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">Balance Due: ₹{balanceDue.toLocaleString('en-IN')}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0">
                                    {status !== 'Paid' && (
                                        <button onClick={() => handleMarkAsPaid(inv)}
                                            className="flex-1 py-3 bg-slate-900 dark:bg-slate-950 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 text-sm shadow-lg">
                                            <Check size={18} /> Mark as Paid
                                        </button>
                                    )}
                                    <button onClick={() => window.print()}
                                        className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        <Receipt size={16} /> Print
                                    </button>
                                    <button onClick={() => setShowViewModal(false)}
                                        className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-sm">
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* ── Mail Confirmation Modal (Live Preview) ── */}
                {showMailModal && mailInvoice && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setShowMailModal(false)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="px-8 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">Email Preview</h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Ready for delivery</span>
                                            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setShowMailModal(false)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <X size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                                </button>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-0 flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x dark:divide-slate-800">
                                {/* Sidebar: Recipients & Meta */}
                                <div className="w-full xl:w-72 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-6 shrink-0 custom-scrollbar overflow-y-auto">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Destination</p>
                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                                    <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Company</span>
                                            </div>
                                            <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight mb-2">{mailInvoice.companyName}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                                                    <Tag size={12} />
                                                    Statement
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Recipients (TO)</p>
                                            <span className="px-2.5 py-1 bg-emerald-500/10 rounded-full text-[9px] font-black text-emerald-600 uppercase border border-emerald-500/20">
                                                {mailRecipients.to.length} Active
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            {mailRecipients.to.length > 0 ? mailRecipients.to.map((email, i) => (
                                                <div key={email + i} className="group px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-all hover:border-emerald-200 dark:hover:border-emerald-800 shadow-sm">
                                                    <div className="w-2 h-2 bg-emerald-400 rounded-full ring-4 ring-emerald-500/10" />
                                                    <span className="truncate">{email}</span>
                                                </div>
                                            )) : (
                                                <div className="p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
                                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold italic">Missing Recipients</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {mailRecipients.cc.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">CC Group</p>
                                            <div className="flex flex-wrap gap-2">
                                                {mailRecipients.cc.map((email, i) => (
                                                    <div key={email + i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-bold text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                                        {email}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Main Content: Live Preview */}
                                <div className="flex-1 bg-white dark:bg-white/5 p-4 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-4 shrink-0">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Live Content Preview</p>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1.5 uppercase tracking-wider">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                HTML Output
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-gray-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 overflow-y-auto custom-scrollbar shadow-inner min-h-[400px]">
                                        {/* Injecting HTML Preview */}
                                        <div
                                            className="email-preview-container bg-white p-6 rounded-xl shadow-sm border border-slate-100/50"
                                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-8 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                <p className="hidden sm:block text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    Reviewing {mailRecipients.to.length + mailRecipients.cc.length} Contacts
                                </p>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => setShowMailModal(false)}
                                        className="flex-1 sm:px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs active:scale-95"
                                    >
                                        Close Preview
                                    </button>
                                    <button
                                        onClick={sendMail}
                                        disabled={sendingMailId === mailInvoice._id || mailRecipients.to.length === 0}
                                        className="flex-[1.5] sm:px-10 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-black dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-xs shadow-xl shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 overflow-hidden relative"
                                    >
                                        {sendingMailId === mailInvoice._id ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span className="font-outfit">Processing Delivery...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="font-outfit">Approve & Send Now</span>
                                                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceList;
