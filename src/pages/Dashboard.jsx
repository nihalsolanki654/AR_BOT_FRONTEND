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
                        pendingAmount: statsData.balanceDue,
                        overdueAmount: statsData.overdueAmount,
                        paidCount: statsData.paidCount,
                        pendingCount: statsData.pendingCount,
                        overdueCount: statsData.overdueCount
                    });

                    // 📊 Revenue Bar Chart Data
                    setRevenueData([
                        { name: "Total", amount: statsData.totalAmount },
                        { name: "Collected", amount: statsData.paidAmount },
                        { name: "Pending", amount: statsData.balanceDue },
                        { name: "Overdue", amount: statsData.overdueAmount }
                    ]);

                    // 🥧 Status Pie Chart Data
                    setStatusData([
                        { name: "Paid", value: statsData.paidCount },
                        { name: "Pending", value: statsData.pendingCount },
                        { name: "Overdue", value: statsData.overdueCount }
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

    const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, subText }) => (
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
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
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
                    value={`₹${Math.round(stats.pendingAmount - stats.overdueAmount).toLocaleString('en-IN')}`}
                    icon={Clock}
                    colorClass="text-amber-600"
                    bgColorClass="bg-amber-50"
                />

                <StatCard
                    title="Overdue"
                    value={`₹${Math.round(stats.overdueAmount).toLocaleString('en-IN')}`}
                    icon={Clock}
                    colorClass="text-rose-600"
                    bgColorClass="bg-rose-50"
                    subText={`${stats.overdueCount} Invoices`}
                />


            </div>

            {/* Invoice Status */}
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 md:mb-8">
                <h2 className="text-sm md:text-base font-bold mb-4 text-gray-900 dark:text-white">
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
