import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    Users,
    Clock,
    CheckCircle2
} from 'lucide-react';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    CartesianGrid,
    Legend
} from "recharts";

const Dashboard = () => {

    const [stats, setStats] = useState({
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0,
        totalMembers: 0
    });

    const [revenueData, setRevenueData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {

        const fetchData = async () => {
            try {
                const [invRes, memRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/invoices`, { cache: 'no-cache' }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/members`, { cache: 'no-cache' })
                ]);

                if (invRes.ok && memRes.ok) {

                    const invoices = await invRes.json();
                    const members = await memRes.json();

                    const totalAmount = invoices.reduce(
                        (sum, inv) => sum + (parseFloat(inv.total_Amount) || 0),
                        0
                    );

                    const totalCollected = invoices.reduce(
                        (sum, inv) => sum + ((parseFloat(inv.total_Amount) || 0) - (parseFloat(inv.balance_due) || 0)),
                        0
                    );

                    const totalPending = totalAmount - totalCollected;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const parseInvoiceDate = (dateText) => {
                        if (!dateText) return null;
                        if (typeof dateText === 'string' && dateText.includes('-') && dateText.split('-')[0].length === 2) {
                            const [dd, mm, yyyy] = dateText.split('-');
                            return new Date(`${yyyy}-${mm}-${dd}`);
                        }
                        return new Date(dateText);
                    };

                    const overdueInvoices = invoices.filter(inv => {
                        const balance = parseFloat(inv.balance_due) || 0;
                        if (balance <= 0) return false;
                        const due = parseInvoiceDate(inv.dueDate);
                        return due && due < today;
                    });

                    const overdueAmount = overdueInvoices.reduce(
                        (sum, inv) => sum + (parseFloat(inv.balance_due) || 0),
                        0
                    );

                    const paidInvoices = invoices.filter(
                        inv => (parseFloat(inv.balance_due) || 0) <= 0
                    );

                    const pendingInvoices = invoices.filter(
                        inv => (parseFloat(inv.balance_due) || 0) > 0 && !overdueInvoices.find(o => o._id === inv._id)
                    );

                    setStats({
                        totalInvoices: invoices.length,
                        totalAmount,
                        paidAmount: totalCollected,
                        pendingAmount: totalPending,
                        overdueAmount,
                        paidCount: paidInvoices.length,
                        pendingCount: pendingInvoices.length,
                        overdueCount: overdueInvoices.length,
                        totalMembers: members.length
                    });

                    // 📊 Revenue Bar Chart Data
                    setRevenueData([
                        { name: "Total", amount: totalAmount },
                        { name: "Collected", amount: totalCollected },
                        { name: "Pending", amount: totalPending },
                        { name: "Overdue", amount: overdueAmount }
                    ]);

                    // 🥧 Status Pie Chart Data
                    setStatusData([
                        { name: "Paid", value: paidInvoices.length },
                        { name: "Pending", value: pendingInvoices.length },
                        { name: "Overdue", value: overdueInvoices.length }
                    ]);

                    // 📈 Monthly Trend Calculation (Dynamic)
                    const monthlyMap = {};

                    invoices.forEach(inv => {
                        const dateText = inv.invoiceDate || inv.createdAt;
                        const date = parseInvoiceDate(dateText);
                        if (!date || isNaN(date.getTime())) return;
                        const month = date.toLocaleString('default', { month: 'short' });

                        if (!monthlyMap[month]) {
                            monthlyMap[month] = 0;
                        }

                        monthlyMap[month] += parseFloat(inv.total_Amount) || 0;
                    });

                    const monthlyData = Object.keys(monthlyMap).map(month => ({
                        month,
                        value: monthlyMap[month]
                    }));

                    setTrendData(monthlyData);
                }

            } catch (error) {
                console.error('Dashboard error:', error);
            }
        };

        fetchData();
        window.addEventListener('focus', fetchData);
        return () => window.removeEventListener('focus', fetchData);

    }, []);

    const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

    const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, subText }) => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${bgColorClass} ${colorClass}`}>
                    <Icon size={22} />
                </div>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
            {subText && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">{subText}</p>
            )}
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto bg-transparent dark:bg-slate-950 min-h-screen">

            {/* Header */}
            <div className="mb-8 md:mb-10 text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Financial Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                    Real-time financial performance overview
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8 md:mb-10">
                <StatCard
                    title="Total Revenue"
                    value={`₹${Math.round(stats.totalAmount).toLocaleString('en-IN')}`}
                    icon={TrendingUp}
                    colorClass="text-blue-600"
                    bgColorClass="bg-blue-50"
                />
                <StatCard
                    title="Active Team"
                    value={stats.totalMembers}
                    icon={Users}
                    colorClass="text-purple-600"
                    bgColorClass="bg-purple-50"
                    subText="Team members"
                />
                <StatCard
                    title="Overdue"
                    value={`₹${Math.round(stats.overdueAmount).toLocaleString('en-IN')}`}
                    icon={Clock}
                    colorClass="text-rose-600"
                    bgColorClass="bg-rose-50"
                    subText={`${stats.overdueCount} Invoices`}
                />
                <StatCard
                    title="Pending Dues"
                    value={`₹${Math.round(stats.pendingAmount - stats.overdueAmount).toLocaleString('en-IN')}`}
                    icon={Clock}
                    colorClass="text-amber-600"
                    bgColorClass="bg-amber-50"
                />
                <StatCard
                    title="Collected"
                    value={`₹${Math.round(stats.paidAmount).toLocaleString('en-IN')}`}
                    icon={CheckCircle2}
                    colorClass="text-emerald-600"
                    bgColorClass="bg-emerald-50"
                />
            </div>

            {/* Invoice Status */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h2 className="text-base md:text-lg font-bold mb-6 text-gray-900 dark:text-white">
                    Invoice Status Distribution
                </h2>
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={80}
                                cx="50%"
                                cy="50%"
                                label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>


        </div>

    );
};

export default Dashboard;
