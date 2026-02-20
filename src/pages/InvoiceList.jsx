import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Trash2, Eye, X, IndianRupee, Calendar, User, MapPin, Receipt, Wallet, Check, Mail } from 'lucide-react';

const InvoiceList = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [paymentInput, setPaymentInput] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/invoices');
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

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/invoices/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    setInvoices(invoices.filter(inv => inv._id !== id));
                }
            } catch (error) {
                console.error('Error deleting invoice:', error);
            }
        }
    };

    const handleMarkAsPaid = async (invoice) => {
        try {
            const response = await fetch(`http://localhost:5000/api/invoices/${invoice._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentStatus: 'Paid',
                    paidAmount: invoice.total
                }),
            });

            if (response.ok) {
                const updatedInvoice = await response.json();
                setInvoices(invoices.map(inv => inv._id === invoice._id ? updatedInvoice : inv));
                setSelectedInvoice(updatedInvoice);
            }
        } catch (error) {
            console.error('Error marking invoice as paid:', error);
        }
    };

    const handlePartialPayment = async (invoice) => {
        const amount = parseFloat(paymentInput);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        const currentPaid = parseFloat(invoice.paidAmount || 0);
        const totalAmount = parseFloat(invoice.total);
        const newPaidAmount = currentPaid + amount;

        if (newPaidAmount > totalAmount) {
            alert(`The total paid amount cannot exceed the invoice total (₹${totalAmount.toFixed(2)})`);
            return;
        }

        const newStatus = newPaidAmount >= totalAmount ? 'Paid' : 'PartiallyPaid';

        try {
            const response = await fetch(`http://localhost:5000/api/invoices/${invoice._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentStatus: newStatus,
                    paidAmount: newPaidAmount
                }),
            });

            if (response.ok) {
                const updatedInvoice = await response.json();
                setInvoices(invoices.map(inv => inv._id === invoice._id ? updatedInvoice : inv));
                setSelectedInvoice(updatedInvoice);
                setPaymentInput('');
            }
        } catch (error) {
            console.error('Error recording partial payment:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'Due': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'PartiallyPaid': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'All' || invoice.paymentStatus === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const calculateDaysLeft = (dueDate) => {
        if (!dueDate) return 'N/A';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const timeDiff = due.getTime() - today.getTime();
        const daysLeft = Math.round(timeDiff / (1000 * 3600 * 24));
        return daysLeft;
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto dark:bg-slate-950 min-h-screen transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
                    <p className="text-gray-500 mt-1">Manage and track all your invoices</p>
                </div>

            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-all duration-300">
                {/* Filters Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-slate-800/20">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search invoice # or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 w-full text-sm outline-none transition-all dark:text-slate-200"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                        <Filter size={18} className="text-gray-400" />
                        {['All', 'Paid', 'Due', 'PartiallyPaid'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterStatus === status
                                    ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-slate-600'
                                    : 'text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {status === 'PartiallyPaid' ? 'Partially Paid' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-500 text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4 text-left">Invoice #</th>
                                <th className="px-6 py-4 text-left">Customer</th>
                                <th className="px-6 py-4 text-left">Invoice Date</th>
                                <th className="px-6 py-4 text-left">Due Date</th>
                                <th className="px-6 py-4 text-left">Days Left</th>
                                <th className="px-6 py-4 text-left">Amount</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-slate-200">{invoice.invoiceNumber}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-slate-200">{invoice.customerName}</div>
                                                <div className="text-xs text-gray-400 dark:text-slate-500">{invoice.customerState}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">{invoice.invoiceDate}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">{invoice.dueDate}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">
                                            {invoice.paymentStatus === 'Paid' ? (
                                                <span className="font-medium text-gray-400 dark:text-slate-500">-</span>
                                            ) : (
                                                <span className={`font-medium ${calculateDaysLeft(invoice.dueDate) < 0 ? 'text-red-500' : 'text-gray-600 dark:text-slate-400'}`}>
                                                    {calculateDaysLeft(invoice.dueDate)} days
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-200">₹{Math.round(invoice.total).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(invoice.paymentStatus)}`}>
                                                {invoice.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedInvoice(invoice); setShowViewModal(true); }}
                                                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => alert('Send Mail functionality coming soon!')}
                                                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                    title="Send Invoice via Email"
                                                >
                                                    <Mail size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(invoice._id)}
                                                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search size={32} className="opacity-20" />
                                            <p>No invoices found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Clean Minimalist Invoice View Modal */}
            {showViewModal && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowViewModal(false)}
                    ></div>

                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Simple Clean Header */}
                        <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <Receipt size={24} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedInvoice.invoiceNumber}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Invoice Details</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-400 dark:text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                            {/* Status and Dates Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Status</p>
                                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(selectedInvoice.paymentStatus)}`}>
                                        {selectedInvoice.paymentStatus === 'PartiallyPaid' ? 'Partial' : selectedInvoice.paymentStatus}
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Issue Date</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedInvoice.invoiceDate}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Due Date</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedInvoice.dueDate}</p>
                                </div>
                            </div>

                            {/* Days Status - Only show if not paid */}
                            {selectedInvoice.paymentStatus !== 'Paid' && (
                                <div className={`rounded-lg p-4 border-l-4 ${calculateDaysLeft(selectedInvoice.dueDate) < 0
                                    ? 'bg-red-50 dark:bg-red-500/10 border-red-500'
                                    : 'bg-blue-50 dark:bg-blue-500/10 border-blue-500'
                                    }`}>
                                    <p className={`text-lg font-black ${calculateDaysLeft(selectedInvoice.dueDate) < 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                        }`}>
                                        {calculateDaysLeft(selectedInvoice.dueDate) < 0
                                            ? `${Math.abs(calculateDaysLeft(selectedInvoice.dueDate))} Days Overdue`
                                            : `${calculateDaysLeft(selectedInvoice.dueDate)} Days Remaining`}
                                    </p>
                                </div>
                            )}

                            {/* Customer Info */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Customer Information</h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedInvoice.customerName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <MapPin size={14} />
                                            <span>{selectedInvoice.customerState || 'N/A'}</span>
                                        </div>
                                        {selectedInvoice.customerMobile && (
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <User size={14} />
                                                <span>{selectedInvoice.customerMobile}</span>
                                            </div>
                                        )}
                                        {selectedInvoice.customerEmail && (
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 col-span-2">
                                                <Mail size={14} />
                                                <span>{selectedInvoice.customerEmail}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Financial Details */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Financial Breakdown</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Gross Amount</span>
                                        <span className="font-bold text-slate-900 dark:text-white">₹{Math.round(selectedInvoice.gross).toLocaleString('en-IN')}</span>
                                    </div>
                                    {selectedInvoice.cgst > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">CGST (9%)</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{Math.round(selectedInvoice.cgst).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {selectedInvoice.sgst > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">SGST (9%)</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{Math.round(selectedInvoice.sgst).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {selectedInvoice.igst > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">IGST (18%)</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{Math.round(selectedInvoice.igst).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-2 mt-2 flex justify-between items-center">
                                        <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                            ₹{Math.round(selectedInvoice.total).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Status */}
                            {selectedInvoice.paymentStatus === 'PartiallyPaid' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 border-2 border-emerald-200 dark:border-emerald-500/30">
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Paid</p>
                                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">₹{Math.round(selectedInvoice.paidAmount || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-500/10 rounded-lg p-3 border-2 border-orange-200 dark:border-orange-500/30">
                                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">Balance</p>
                                        <p className="text-xl font-black text-orange-700 dark:text-orange-300">₹{Math.round(parseFloat(selectedInvoice.total) - parseFloat(selectedInvoice.paidAmount || 0)).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            )}

                            {selectedInvoice.paymentStatus === 'Paid' && (
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-4 flex items-center gap-3 border-2 border-emerald-200 dark:border-emerald-500/30">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Check size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-emerald-900 dark:text-emerald-100">Payment Completed</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Full amount received</p>
                                    </div>
                                </div>
                            )}

                            {/* Payment Collection */}
                            {selectedInvoice.paymentStatus !== 'Paid' && (
                                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-500/30">
                                    <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                        <Wallet size={16} />
                                        Record Payment
                                    </h3>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Enter amount"
                                                value={paymentInput}
                                                onChange={(e) => setPaymentInput(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handlePartialPayment(selectedInvoice)}
                                            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                        Balance: ₹{Math.round(parseFloat(selectedInvoice.total) - parseFloat(selectedInvoice.paidAmount || 0)).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-800 flex gap-2">
                            {selectedInvoice.paymentStatus !== 'Paid' && (
                                <button
                                    onClick={() => handleMarkAsPaid(selectedInvoice)}
                                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Check size={18} />
                                    Mark as Paid
                                </button>
                            )}
                            <button
                                onClick={() => window.print()}
                                className="px-5 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                            >
                                <Receipt size={16} />
                                Print
                            </button>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-md active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InvoiceList;

