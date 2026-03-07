import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import './Analytics.css';

const pieColors = [
    '#00BCD4', '#FF5252', '#00E676', '#7C4DFF', '#FF9800',
    '#E91E63', '#8BC34A', '#03A9F4', '#FFC107', '#9C27B0'
];

const ChevronLeft = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15,18 9,12 15,6" />
    </svg>
);
const ChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9,6 15,12 9,18" />
    </svg>
);

export default function Analytics() {
    const {
        periodData,
        currentFilter,
        setCurrentFilter,
        navigatePeriod,
        resetPeriod,
        currentOffset,
        categories
    } = useApp();

    const [selectedType, setSelectedType] = useState('expense');

    const transactions = periodData?.transactions || [];
    const summary = periodData?.summary || { income: 0, expense: 0, balance: 0 };
    const period = periodData?.period || '';

    // Category breakdown
    const getCategoryBreakdown = () => {
        const breakdown = {};
        transactions
            .filter(t => t.type === selectedType)
            .forEach(t => {
                const key = t.category || 'Other';
                breakdown[key] = (breakdown[key] || 0) + (t.amount || 0);
            });
        return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    };

    const categoryBreakdown = getCategoryBreakdown();
    const totalAmount = categoryBreakdown.reduce((sum, [, val]) => sum + val, 0);

    // Pie chart
    const getPieSegments = () => {
        let cumulative = 0;
        return categoryBreakdown.map(([category, amount], index) => {
            const percent = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            const startAngle = cumulative * 3.6;
            cumulative += percent;
            const endAngle = cumulative * 3.6;
            return { category, amount, percent, color: pieColors[index % pieColors.length], startAngle, endAngle };
        });
    };

    const createPieSlice = (startAngle, endAngle, color, index) => {
        const r = 80, cx = 100, cy = 100;
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);
        const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return <path key={index} d={d} fill={color} stroke="var(--primary-bg)" strokeWidth="2" />;
    };

    const pieSegments = getPieSegments();

    // Payment method breakdown
    const paymentBreakdown = (() => {
        const b = {};
        transactions.forEach(t => {
            const pm = t.paymentMethod || 'CASH';
            b[pm] = (b[pm] || 0) + 1;
        });
        return Object.entries(b).sort((a, b) => b[1] - a[1]);
    })();

    const getCategoryIcon = (name) =>
        categories.find(c => c.name === name)?.icon || '📦';

    return (
        <div className="analytics-container">
            <h2 className="analytics-title">📊 Analytics</h2>

            {/* Period filter tabs */}
            <div className="analytics-view-tabs">
                {['daily', 'weekly', 'monthly', 'yearly'].map(f => (
                    <button
                        key={f}
                        className={`analytics-view-tab ${currentFilter === f ? 'active' : ''}`}
                        onClick={() => { setCurrentFilter(f); resetPeriod(); }}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Period navigator */}
            <div className="month-selector">
                <button className="month-nav-btn" onClick={() => navigatePeriod(-1)}><ChevronLeft /></button>
                <div className="month-display">
                    <div className="month-name">{period}</div>
                    {currentOffset !== 0 && (
                        <div className="month-year clickable" onClick={resetPeriod} style={{ color: 'var(--sky-blue)', fontSize: '0.8rem' }}>
                            ↩ Reset
                        </div>
                    )}
                </div>
                <button className="month-nav-btn" onClick={() => navigatePeriod(1)}><ChevronRight /></button>
            </div>

            {/* Overview Cards */}
            <div className="analytics-overview">
                <div
                    className={`overview-card clickable ${selectedType === 'income' ? 'selected' : ''}`}
                    onClick={() => setSelectedType('income')}
                >
                    <div className="overview-value income">{formatCurrency(summary.income)}</div>
                    <div className="overview-label">Total Income</div>
                </div>
                <div
                    className={`overview-card clickable ${selectedType === 'expense' ? 'selected' : ''}`}
                    onClick={() => setSelectedType('expense')}
                >
                    <div className="overview-value expense">{formatCurrency(summary.expense)}</div>
                    <div className="overview-label">Total Expenses</div>
                </div>
                <div className="overview-card">
                    <div className={`overview-value ${summary.balance < 0 ? 'negative-balance' : 'savings'}`}>
                        {formatCurrency(Math.abs(summary.balance))}
                    </div>
                    <div className="overview-label">Net Balance</div>
                </div>
                <div className="overview-card">
                    <div className="overview-value count">{transactions.length}</div>
                    <div className="overview-label">Transactions</div>
                </div>
            </div>

            {/* Pie Chart */}
            <div className="pie-chart-section">
                <h3 className="chart-title">
                    {selectedType === 'income' ? '💰 Income Breakdown' : '💳 Expense Breakdown'}
                </h3>
                {categoryBreakdown.length > 0 ? (
                    <div className="pie-chart-container">
                        <div className="pie-chart-wrapper">
                            <svg viewBox="0 0 200 200" className="pie-chart-svg">
                                {pieSegments.length === 1 ? (
                                    <circle cx="100" cy="100" r="80" fill={pieSegments[0].color} stroke="var(--primary-bg)" strokeWidth="2" />
                                ) : (
                                    pieSegments.map((seg, i) => createPieSlice(seg.startAngle, seg.endAngle, seg.color, i))
                                )}
                                <circle cx="100" cy="100" r="45" fill="var(--card-bg)" />
                                <text x="100" y="95" textAnchor="middle" className="pie-center-text">{formatCurrency(totalAmount)}</text>
                                <text x="100" y="115" textAnchor="middle" className="pie-center-label">Total</text>
                            </svg>
                        </div>
                        <div className="pie-legend">
                            {pieSegments.map((seg) => (
                                <div key={seg.category} className="legend-item">
                                    <span className="legend-color" style={{ background: seg.color }} />
                                    <span className="legend-icon">{getCategoryIcon(seg.category)}</span>
                                    <span className="legend-name">{seg.category}</span>
                                    <span className="legend-amount">{formatCurrency(seg.amount)}</span>
                                    <span className="legend-percent">{seg.percent.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="no-data-message">
                        <p>No {selectedType} transactions for this period</p>
                    </div>
                )}
            </div>

            {/* Payment Method Breakdown */}
            {paymentBreakdown.length > 0 && (
                <div className="source-section">
                    <h3 className="chart-title">💳 Payment Method Breakdown</h3>
                    <div className="source-grid">
                        {paymentBreakdown.map(([method, count]) => (
                            <div key={method} className="source-card">
                                <div className="source-count">{count}</div>
                                <div className="source-label">{method}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
