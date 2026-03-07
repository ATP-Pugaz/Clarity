// 🚀 FRONTEND RUN: npm run dev
// 🚀 SCALE/BUILD: npm run build
// 🚀 PREVIEW: npm run preview
// 🚀 DEPLOY: npx vercel
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import TransactionModal from '../Modals/TransactionModal';
import {
    getGreeting,
    formatCurrency,
    groupTransactionsByDate
} from '../../utils/helpers';
import './Home.css';

// Navigation Arrow Icons
const ChevronLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const ChevronRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const FilterIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

const ChevronDown = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

export default function Home() {
    const {
        currentFilter,
        currentOffset,
        setCurrentFilter,
        periodData,
        navigatePeriod,
        resetPeriod,
        categories
    } = useApp();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [expandedDates, setExpandedDates] = useState({});

    const { summary, transactions, period } = periodData;

    // Group transactions by date
    const groupedTransactions = groupTransactionsByDate(transactions);
    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

    // Expand the most recent date by default
    useEffect(() => {
        if (sortedDates.length > 0 && Object.keys(expandedDates).length === 0) {
            setExpandedDates({ [sortedDates[0]]: true });
        }
    }, [transactions.length]);

    const handleFilterChange = (filter) => {
        setCurrentFilter(filter);
        resetPeriod();
        setShowFilterDropdown(false);
    };

    const toggleDateGroup = (date) => {
        console.log('Toggling group:', date);
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    // Calculate income-to-expense ratio for balance progress bar
    const totalFlow = summary.income + summary.expense;
    const incomePercent = totalFlow > 0 ? Math.round((summary.income / totalFlow) * 100) : 50;
    const expensePercent = totalFlow > 0 ? Math.round((summary.expense / totalFlow) * 100) : 50;

    return (
        <div className="home-container">
            {/* Header section with Balance and Filter */}
            <div className="home-header-top">
                <div className="greeting-wrapper">
                    <h1 className="greeting-text">{getGreeting()}! 👋</h1>
                    <div className="balance-summary-main">
                        <span className="balance-label">Total Balance</span>
                        <h2 className={`balance-amount ${summary.balance < 0 ? 'negative' : ''}`}>
                            {formatCurrency(summary.balance)}
                        </h2>
                    </div>
                </div>

                <div className="filter-dropdown-container">
                    <button
                        className="filter-toggle-btn"
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        aria-label="Filter"
                    >
                        <FilterIcon />
                    </button>
                    {showFilterDropdown && (
                        <div className="filter-menu">
                            {['daily', 'weekly', 'monthly', 'yearly'].map(f => (
                                <button
                                    key={f}
                                    className={`filter-option ${currentFilter === f ? 'active' : ''}`}
                                    onClick={() => handleFilterChange(f)}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Time Navigation Bar */}
            <div className="time-nav-bar">
                <button className="nav-arrow-btn" onClick={() => navigatePeriod(-1)} aria-label="Previous period">
                    <ChevronLeft />
                </button>
                <div className="view-label-container">
                    <span className="current-view-label">{period}</span>
                    {currentOffset !== 0 && (
                        <button className="reset-offset-btn" onClick={resetPeriod}>Today</button>
                    )}
                </div>
                <button className="nav-arrow-btn" onClick={() => navigatePeriod(1)} aria-label="Next period">
                    <ChevronRight />
                </button>
            </div>

            {/* Summary Cards Panel — Income | Expense | Balance */}
            <div className="summary-cards-panel">
                {/* Income Card */}
                <div className="summary-stat income">
                    <div className="stat-icon income-icon">
                        <i className="bi bi-arrow-down-circle-fill"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Income</span>
                        <span className="stat-value">{formatCurrency(summary.income)}</span>
                    </div>
                </div>

                {/* Expense Card */}
                <div className="summary-stat expense">
                    <div className="stat-icon expense-icon">
                        <i className="bi bi-arrow-up-circle-fill"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Expense</span>
                        <span className="stat-value">{formatCurrency(summary.expense)}</span>
                    </div>
                </div>

                {/* Balance Card — Full Width with Income vs Expense Bar */}
                <div className="summary-stat balance balance-full">
                    <div className="stat-icon balance-icon">
                        <i className="bi bi-wallet2"></i>
                    </div>
                    <div className="stat-info flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="stat-label">Balance</span>
                            <span className={`stat-value ${summary.balance < 0 ? 'negative' : ''}`}>
                                {formatCurrency(summary.balance)}
                            </span>
                        </div>
                        {totalFlow > 0 && (
                            <div className="balance-bar-wrapper">
                                <div className="balance-bar-track">
                                    <div
                                        className="balance-bar-income"
                                        style={{ width: `${incomePercent}%` }}
                                        title={`Income: ${incomePercent}%`}
                                    />
                                    <div
                                        className="balance-bar-expense"
                                        style={{ width: `${expensePercent}%` }}
                                        title={`Expense: ${expensePercent}%`}
                                    />
                                </div>
                                <div className="balance-bar-labels">
                                    <span className="bar-label income-label">
                                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '6px' }}></i>
                                        Income {incomePercent}%
                                    </span>
                                    <span className="bar-label expense-label">
                                        Expense {expensePercent}%
                                        <i className="bi bi-circle-fill ms-1" style={{ fontSize: '6px' }}></i>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="home-transactions-section">
                <div className="section-header">
                    <h3>Date-wise Transactions</h3>
                    <span className="tx-count badge rounded-pill">{transactions.length} total</span>
                </div>

                <div className="transactions-grouped-list">
                    {sortedDates.length > 0 ? (
                        sortedDates.map(dateKey => {
                            const dateTransactions = groupedTransactions[dateKey];
                            const isExpanded = expandedDates[dateKey];

                            // Calculate daily total for the header with safety checks
                            const dailyNet = dateTransactions.reduce((acc, t) => {
                                const amt = parseFloat(t.amount) || 0;
                                return acc + (t.type === 'income' ? amt : -amt);
                            }, 0);

                            return (
                                <div key={dateKey} className={`date-group-wrapper ${isExpanded ? 'expanded' : ''}`}>
                                    <button
                                        className={`date-group-header ${isExpanded ? 'active' : ''} ${dailyNet > 0 ? 'income-day' : ''}`}
                                        onClick={() => toggleDateGroup(dateKey)}
                                    >
                                        <div className="date-header-info">
                                            <span className="date-pill">
                                                {new Date(dateKey).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </span>
                                            <span className="date-full-text">
                                                {new Date(dateKey).toLocaleDateString('en-IN', { weekday: 'long' })}
                                            </span>
                                        </div>
                                        <div className="date-header-stats">
                                            <span className={`date-net-amount ${dailyNet >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {dailyNet >= 0 ? '+' : ''}{formatCurrency(dailyNet)}
                                            </span>
                                            <div className={`chevron-icon ${isExpanded ? 'rotate' : ''}`}>
                                                <ChevronDown />
                                            </div>
                                        </div>
                                    </button>

                                    <div className="date-group-content">
                                        {dateTransactions.map(t => (
                                            <div key={t.id} className="mini-tx-card">
                                                <div className="tx-icon-circle">
                                                    {categories.find(c => c.name === t.category)?.icon || '📦'}
                                                </div>
                                                <div className="tx-main-info">
                                                    <span className="tx-category-name">{t.category}</span>
                                                    <span className="tx-description-small text-truncate" style={{ maxWidth: '150px' }}>
                                                        {t.description}
                                                    </span>
                                                </div>
                                                <div className="tx-amount-wrapper">
                                                    <span className={`tx-amount-v2 ${t.type}`}>
                                                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                                    </span>
                                                    <span className="tx-payment-method-tag">{t.paymentMethod || 'ACC'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-period-state">
                            <div className="empty-icon">📂</div>
                            <p>No transactions for this period</p>
                            <button className="empty-add-btn" onClick={() => setIsModalOpen(true)}>
                                Add Transaction
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Add Button */}
            <button className="fab-button-v2" onClick={() => setIsModalOpen(true)} aria-label="Add transaction">
                <PlusIcon />
            </button>

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={{ date: new Date().toISOString() }}
            />
        </div>
    );
}

