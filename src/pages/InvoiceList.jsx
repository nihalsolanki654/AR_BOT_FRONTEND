import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Eye, X, MapPin, Receipt, Wallet, Check, Mail, FileText, Tag, Building2, Package, Percent, Calendar } from 'lucide-react';

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
        <div className="p-6 md:p-10 max-w-7xl mx-auto dark:bg-slate-950 min-h-screen transition-colors duration-300">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Invoices</h1>
                    <p className="text-gray-500 mt-1">Manage and track all your invoices</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/add-invoice')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Invoice</span>
                    </button>
                    <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                        <Calendar size={20} className="text-blue-500" />
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
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
                {/* Scrollable Records List */}
                <div className="flex flex-col">
                    {/* Header - Fixed structure to match records */}
                    <div className="hidden lg:block bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30 transition-colors">
                        <div ref={headerScrollRef} className="overflow-x-auto scrollbar-hide">
                            <div className="flex items-center min-w-max px-2">
                                <div className="w-[120px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Invoice No</div>
                                <div className="w-[220px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Company</div>
                                <div className="w-[110px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Invoice Date</div>
                                <div className="w-[110px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Due Date</div>
                                <div className="w-[110px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Today Date</div>
                                <div className="w-[100px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Terms</div>
                                <div className="w-[220px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Description</div>
                                <div className="w-[120px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Unit Price</div>
                                <div className="w-[70px] px-4 py-4 text-center text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Qty</div>
                                <div className="w-[120px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Subtotal</div>
                                <div className="w-[70px] px-4 py-4 text-center text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">GST %</div>
                                <div className="w-[120px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">GST Amt</div>
                                <div className="w-[130px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Total</div>
                                <div className="w-[130px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Balance</div>
                                <div className="w-[130px] px-4 py-4 text-left text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider">Status</div>
                                <div className="w-[120px] px-4 py-4 text-right text-sm font-bold text-gray-600 dark:text-slate-500 uppercase tracking-wider pr-6">Actions</div>
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
                                        <div className="flex items-center min-w-max px-2 py-3">
                                            {/* Invoice # */}
                                            <div className="w-[120px] px-4 font-bold text-gray-900 dark:text-slate-100 text-sm">
                                                {getInvoiceNumber(invoice)}
                                            </div>

                                            {/* Company */}
                                            <div className="w-[220px] px-4">
                                                <div className="font-bold text-gray-900 dark:text-slate-100 text-sm whitespace-normal" title={invoice.companyName}>{invoice.companyName || 'N/A'}</div>
                                                <div className="text-[11px] text-gray-400 truncate uppercase tracking-tight">{invoice.State || ''}</div>
                                            </div>

                                            {/* Invoice Date */}
                                            <div className="w-[110px] px-4 text-sm text-gray-700 dark:text-slate-300 font-medium">
                                                {invoice.invoiceDate || '-'}
                                            </div>

                                            {/* Due Date */}
                                            <div className="w-[110px] px-4 text-sm text-gray-700 dark:text-slate-300 font-medium">
                                                {invoice.dueDate || '-'}
                                            </div>

                                            {/* Today Date */}
                                            <div className="w-[110px] px-4 text-sm text-gray-500 dark:text-slate-400 font-medium italic">
                                                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                                            </div>

                                            {/* Terms (Dynamic calculation: Today - Due Date) */}
                                            <div className="w-[100px] px-4 text-sm font-medium whitespace-nowrap text-center">
                                                {status === 'Paid'
                                                    ? <span className="text-gray-400 font-bold">-</span>
                                                    : daysLeft === 0
                                                        ? <div className="flex flex-col items-center">
                                                            <span className="text-blue-600 text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20 shadow-sm">DUE TODAY</span>
                                                            <span className="text-[9px] text-gray-400 mt-0.5 font-bold">0</span>
                                                        </div>
                                                        : daysLeft < 0
                                                            ? <div className="flex flex-col items-center">
                                                                <span className="text-rose-600 text-[10px] font-black bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/20 shadow-sm">{Math.abs(daysLeft)}D OVERDUE</span>
                                                                <span className="text-[9px] text-gray-400 mt-0.5 font-bold">{Math.abs(daysLeft)}</span>
                                                            </div>
                                                            : <div className="flex flex-col items-center gap-0.5">
                                                                <span className="text-gray-700 dark:text-slate-300 font-bold">{-daysLeft}</span>
                                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Due in {daysLeft}d</span>
                                                            </div>
                                                }
                                            </div>

                                            {/* Description */}
                                            <div className="w-[220px] px-4">
                                                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic font-medium" title={invoice.description || ''}>
                                                    {invoice.description || 'No description'}
                                                </div>
                                            </div>

                                            {/* Unit Price */}
                                            <div className="w-[120px] px-4 text-sm text-gray-800 dark:text-slate-200 font-bold whitespace-nowrap">
                                                ₹{parseFloat(invoice.total_price || 0).toLocaleString('en-IN')}
                                            </div>

                                            {/* Qty */}
                                            <div className="w-[70px] px-4 text-center text-sm text-gray-700 dark:text-slate-300 font-medium">
                                                {invoice.quantity ?? '-'}
                                            </div>

                                            {/* Subtotal (Unit * Qty) */}
                                            <div className="w-[120px] px-4 text-sm text-gray-800 dark:text-slate-200 font-bold whitespace-nowrap">
                                                ₹{parseFloat(invoice.subtotal || (invoice.total_price * (invoice.quantity || 1)) || 0).toLocaleString('en-IN')}
                                            </div>

                                            {/* GST % */}
                                            <div className="w-[70px] px-4 text-center text-sm text-gray-700 dark:text-slate-300 font-medium">
                                                {invoice.GST ? `${invoice.GST}%` : '-'}
                                            </div>

                                            {/* GST Amt */}
                                            <div className="w-[120px] px-4 text-sm text-gray-800 dark:text-slate-200 font-bold whitespace-nowrap">
                                                ₹{parseFloat(invoice.GST_Amount || 0).toLocaleString('en-IN')}
                                            </div>

                                            {/* Total Amount */}
                                            <div className="w-[130px] px-4 font-black text-gray-900 dark:text-white text-sm whitespace-nowrap">
                                                ₹{parseFloat(invoice.total_Amount || 0).toLocaleString('en-IN')}
                                            </div>

                                            {/* Balance Due */}
                                            <div className="w-[130px] px-4 font-black text-indigo-600 dark:text-indigo-400 text-sm whitespace-nowrap">
                                                ₹{parseFloat(invoice.balance_due || 0).toLocaleString('en-IN')}
                                            </div>


                                            {/* Status */}
                                            <div className="w-[130px] px-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(status)}`}>
                                                    {status === 'PartiallyPaid' ? 'Partial' : status}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="w-[120px] px-4 pr-6">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => { setSelectedInvoice(invoice); setShowViewModal(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="View">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={() => alert('Send Mail coming soon!')}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all" title="Email">
                                                        <Mail size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(invoice._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete">
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
                    <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/10">
                        <div className="text-sm text-gray-500 dark:text-slate-400">
                            Page <span className="font-bold text-gray-800 dark:text-white">{pagination.currentPage}</span> of <span className="font-bold text-gray-800 dark:text-white">{pagination.pages}</span> ({pagination.total} total)
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.currentPage === 1}
                                onClick={() => fetchInvoices(pagination.currentPage - 1)}
                                className={`px-4 py-1.5 text-xs font-bold border rounded-lg transition-all ${pagination.currentPage === 1
                                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                    : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 shadow-sm'}`}
                            >
                                Previous
                            </button>
                            <button
                                disabled={pagination.currentPage === pagination.pages}
                                onClick={() => fetchInvoices(pagination.currentPage + 1)}
                                className={`px-4 py-1.5 text-xs font-bold border rounded-lg transition-all ${pagination.currentPage === pagination.pages
                                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                    : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 shadow-sm'}`}
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
                                            <p className={`text-base font-black ${daysLeft < 0 ? 'text-red-600' : (daysLeft === 0 ? 'text-blue-600' : 'text-emerald-600')}`}>
                                                {daysLeft < 0 ? `${Math.abs(daysLeft)} Days Overdue` : (daysLeft === 0 ? 'Due TODAY' : `${Math.abs(daysLeft)} Days Remaining`)}
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
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Financial Breakdown</p>
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Subtotal (Unit × Qty)</span>
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
        </div>
    );
};

export default InvoiceList;
