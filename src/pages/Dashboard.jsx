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
        pendingCount: 0
    });

    const [revenueData, setRevenueData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const [statsRes, trendRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/invoices/stats`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/invoices`)
                ]);

                if (statsRes.ok && trendRes.ok) {
                    const statsData = await statsRes.json();
                    const trendInvoices = await trendRes.json();

                    // Map backend stats to frontend state
                    setStats({
                        totalInvoices: statsData.totalInvoices,
                        totalAmount: statsData.totalAmount,
                        paidAmount: statsData.paidAmount,
                        pendingAmount: statsData.pendingAmount,
                        overdueAmount: statsData.overdueAmount,
                        partialAmount: statsData.partialAmount,
                        paidCount: statsData.paidCount,
                        pendingCount: statsData.pendingCount,
                        overdueCount: statsData.overdueCount,
                        partialCount: statsData.partialCount
                    });

                    // 📊 Revenue Bar Chart Data
                    setRevenueData([
                        { name: "Collected", amount: statsData.paidAmount },
                        { name: "Pending", amount: statsData.pendingAmount },
                        { name: "Overdue", amount: statsData.overdueAmount }
                    ]);

                    // 🥧 Status Pie Chart Data
                    setStatusData([
                        { name: "Paid", value: statsData.paidCount },
                        { name: "Pending", value: statsData.pendingCount },
                        { name: "Overdue", value: Math.max(0, statsData.overdueCount) }
                    ]);

                    // 📈 Monthly Trend Calculation (Keep as is for now until we have a trend endpoint)
                    const parseInvoiceDate = (dateText) => {
                        if (!dateText) return null;
                        if (typeof dateText === 'string' && dateText.includes('-') && dateText.split('-')[0].length === 2) {
                            const [dd, mm, yyyy] = dateText.split('-');
                            return new Date(`${yyyy}-${mm}-${dd}`);
                        }
                        return new Date(dateText);
                    };

                    const monthlyMap = {};
                    const invoicesArray = Array.isArray(trendInvoices) ? trendInvoices : (trendInvoices.invoices || []);

                    invoicesArray.forEach(inv => {
                        const dateText = inv.invoiceDate || inv.createdAt;
                        const date = parseInvoiceDate(dateText);
                        if (!date || isNaN(date.getTime())) return;
                        const month = date.toLocaleString('default', { month: 'short' });
                        monthlyMap[month] = (monthlyMap[month] || 0) + (parseFloat(inv.total_Amount) || 0);
                    });

                    setTrendData(Object.keys(monthlyMap).map(month => ({ month, value: monthlyMap[month] })));

                    // Sort by newest and take top 5
                    const sortedInvoices = [...invoicesArray].sort((a, b) => {
                        const dateA = parseInvoiceDate(a.invoiceDate || a.createdAt);
                        const dateB = parseInvoiceDate(b.invoiceDate || b.createdAt);
                        return dateB - dateA;
                    }).slice(0, 5);
                    setRecentInvoices(sortedInvoices);
                }
            } catch (error) {
                console.error('Dashboard optimization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

    const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, subText, valueColorClass }) => (
        <div className={`bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${isLoading ? 'bg-gray-100 dark:bg-slate-800' : `${bgColorClass} ${colorClass}`}`}>
                    <Icon size={18} className={isLoading ? 'text-gray-300 dark:text-slate-700' : ''} />
                </div>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-[13px] mb-1 font-medium">{title}</p>
            {isLoading ? (
                <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-md w-2/3 mb-1" />
            ) : (
                <h3 className={`text-xl md:text-2xl font-bold tracking-tight ${valueColorClass ? valueColorClass : 'text-gray-900 dark:text-white'}`}>{value}</h3>
            )}
            {subText && (
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 font-medium">{subText}</p>
            )}
        </div>
    );

    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto bg-transparent dark:bg-slate-950 min-h-screen">

            {/* Header */}
            <div className="mb-6 md:mb-8 text-center md:text-left">
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    Financial Analytics Dashboard
                </h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">
                    Real-time financial performance overview
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                <StatCard
                    title="Total Revenue"
                    value={`₹${Math.round(stats.totalAmount).toLocaleString('en-IN')}`}
                    icon={TrendingUp}
                    colorClass="text-blue-600"
                    bgColorClass="bg-blue-50"
                />

                <StatCard
                    title="Collected"
                    value={`₹${Math.round(stats.paidAmount).toLocaleString('en-IN')}`}
                    icon={CheckCircle2}
                    colorClass="text-emerald-600"
                    bgColorClass="bg-emerald-50"
                />

                <StatCard
                    title="Pending Dues"
                    value={`₹${Math.round(stats.pendingAmount || 0).toLocaleString('en-IN')}`}
                    icon={Clock}
                    colorClass="text-amber-600"
                    bgColorClass="bg-amber-50"
                    subText={`${stats.pendingCount || 0} Invoices`}
                />

                <StatCard
                    title="Overdue"
                    value={`₹${Math.round(stats.overdueAmount || 0).toLocaleString('en-IN')}`}
                    icon={Clock}
                    colorClass="text-rose-600"
                    bgColorClass="bg-rose-50"
                    valueColorClass="text-rose-600 dark:text-rose-400"
                    subText={`${stats.overdueCount || 0} Invoices`}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
                {/* Invoice Status Distribution (Pie Chart) */}
                <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-shadow duration-300">
                    <h2 className="text-sm md:text-base font-bold mb-6 text-gray-900 dark:text-white">
                        Invoice Status Distribution
                    </h2>
                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={110}
                                    innerRadius={70}
                                    cx="50%"
                                    cy="50%"
                                    paddingAngle={5}
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity duration-200" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                                    itemStyle={{ color: '#1F2937', fontWeight: 500 }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue Breakdown (Bar Chart) */}
                <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                            Financial Breakdown Overview
                        </h2>
                    </div>
                    <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 30, right: 10, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#4B5563', fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `₹${value >= 1000 ? value / 1000 + 'k' : value}`} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)' }}
                                    itemStyle={{ color: '#1F2937', fontWeight: 600 }}
                                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                                />
                                <Bar
                                    dataKey="amount"
                                    radius={[20, 20, 20, 20]}
                                    maxBarSize={40}
                                    background={{ fill: '#F3F4F6', radius: [20, 20, 20, 20] }}
                                    label={{ position: 'top', fill: '#4B5563', fontSize: 13, fontWeight: 600, formatter: (val) => `₹${Math.round(val).toLocaleString('en-IN')}` }}
                                >
                                    {revenueData.map((entry, index) => {
                                        const barColors = {
                                            "Collected": "#10B981",  // Emerald
                                            "Pending": "#F59E0B",    // Amber
                                            "Overdue": "#EF4444"     // Rose
                                        };
                                        return <Cell key={`cell-${index}`} fill={barColors[entry.name] || "#8884d8"} className="hover:opacity-80 transition-opacity duration-300 drop-shadow-sm" />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>


            {/* Bottom Section: KPI & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Insights Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 md:p-6 rounded-2xl shadow-md text-white h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-bold mb-2">Automated Insights</h2>
                                    <p className="text-indigo-100 text-sm max-w-lg leading-relaxed">
                                        Your collection rate has improved by <span className="font-semibold text-white">12%</span> this month. However, there are currently <span className="font-semibold text-rose-200">{stats.overdueCount || 0} invoices</span> overdue. Consider sending automated reminders to accelerate cash flow.
                                    </p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm hidden sm:block">
                                    <TrendingUp size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <a href="/invoices?status=Overdue" className="px-4 py-2 bg-white text-indigo-600 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition-colors inline-block text-center">
                                Review Overdue
                            </a>
                            <a href="/invoices" className="px-4 py-2 bg-indigo-600/50 text-white text-sm font-semibold border border-indigo-400/50 rounded-lg hover:bg-indigo-600/70 transition-colors inline-block text-center">
                                View Full Report
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right: KPI Cards Stacked */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                                <Clock size={16} className="text-blue-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Payment Time</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">14.5 <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Days</span></p>
                        <p className="text-xs text-emerald-500 mt-2 font-medium flex items-center gap-1">
                            <TrendingUp size={12} /> -2.4 days vs last month
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-slate-800 flex items-center justify-center">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Collection Rate</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.totalAmount > 0 ? Math.round((stats.paidAmount / stats.totalAmount) * 100) : 0}%
                        </p>
                        <p className="text-xs text-emerald-500 mt-2 font-medium flex items-center gap-1">
                            <TrendingUp size={12} /> +5.2% vs last month
                        </p>
                    </div>
                </div>
            </div>

        </div>

    );
};

export default Dashboard;
