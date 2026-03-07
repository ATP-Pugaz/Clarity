import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
    formatCurrency,
    groupTransactionsByDate
} from '../../utils/helpers';
import './Transactions.css';

const ChevronLeft = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const ChevronRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const ChevronDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

export default function Transactions() {
    const {
        currentFilter,
        currentOffset,
        setCurrentFilter,
        navigatePeriod,
        resetPeriod,
        updateTransaction,
        deleteTransaction,
        clearAllData,
        categories,
        periodData
    } = useApp();

    const [editingField, setEditingField] = useState(null); // { id, field }
    const [expandedDates, setExpandedDates] = useState({});

    const transactions = periodData?.transactions || [];
    const summary = periodData?.summary || { income: 0, expense: 0, balance: 0 };
    const period = periodData?.period || '';

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
    };

    const toggleDateGroup = (date) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    const handleFieldUpdate = async (id, field, value) => {
        await updateTransaction(id, { [field]: value });
        setEditingField(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            await deleteTransaction(id);
        }
    };


    return (
        <div className="transactions-container">
            {/* Extended Header with Time Filters & Nav */}
            <div className="transactions-header-new">
                <div className="time-nav-section">
                    <button className="nav-round-btn" onClick={() => navigatePeriod(-1)}>
                        <ChevronLeft />
                    </button>
                    <div className="period-label-wrapper">
                        <span className="period-label-main">{period}</span>
                    </div>
                    <button className="nav-round-btn" onClick={() => navigatePeriod(1)}>
                        <ChevronRight />
                    </button>
                </div>

                <div className="time-filter-buttons">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(f => (
                        <button
                            key={f}
                            className={`filter-text-btn ${currentFilter === f ? 'active' : ''}`}
                            onClick={() => handleFilterChange(f)}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Transactions Grouped List */}
            <div className="transactions-main-list">
                {sortedDates.length > 0 && (
                    <div className="list-columns-header">
                        <span>Transaction</span>
                        <span>Category</span>
                        <span>Subcategory</span>
                        <span>Amount</span>
                    </div>
                )}

                {sortedDates.length > 0 ? (
                    sortedDates.map(dateKey => {
                        const dateTransactions = groupedTransactions[dateKey];
                        const isExpanded = expandedDates[dateKey];
                        const dailyNet = dateTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

                        return (
                            <div key={dateKey} className="date-group-section">
                                <button
                                    className={`date-header-row ${isExpanded ? 'active' : ''}`}
                                    onClick={() => toggleDateGroup(dateKey)}
                                >
                                    <div className="date-label-side">
                                        <span className="date-badge">
                                            {new Date(dateKey).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <span className="day-name">
                                            {new Date(dateKey).toLocaleDateString('en-IN', { weekday: 'long' })}
                                        </span>
                                    </div>
                                    <div className="date-stats-side">
                                        <span className={`daily-net ${dailyNet >= 0 ? 'plus' : 'minus'}`}>
                                            {dailyNet >= 0 ? '+' : ''}{formatCurrency(dailyNet)}
                                        </span>
                                        <div className={`chevron ${isExpanded ? 'up' : ''}`}>
                                            <ChevronDown />
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="date-group-rows fade-in-rapid">
                                        {dateTransactions.map(t => (
                                            <div key={t.id} className="tx-list-row v4">
                                                <div className="tx-basic-col">
                                                    <span className="tx-icon-v3">
                                                        {categories.find(c => c.name === t.category)?.icon || '📦'}
                                                    </span>
                                                    <div className="tx-title-stack">
                                                        <span className="tx-desc-v3">{t.description || 'No description'}</span>
                                                        <span className="tx-time-v3">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>

                                                {/* Editable Category */}
                                                <div className="tx-editable-col">
                                                    {editingField?.id === t.id && editingField?.field === 'category' ? (
                                                        <select
                                                            className="inline-select"
                                                            autoFocus
                                                            onBlur={() => setEditingField(null)}
                                                            onChange={(e) => handleFieldUpdate(t.id, 'category', e.target.value)}
                                                            value={t.category}
                                                        >
                                                            {categories.map(c => (
                                                                <option key={c.id} value={c.name}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span
                                                            className="editable-text"
                                                            onClick={() => setEditingField({ id: t.id, field: 'category' })}
                                                        >
                                                            {t.category}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Editable Subcategory */}
                                                <div className="tx-editable-col">
                                                    {editingField?.id === t.id && editingField?.field === 'subCategory' ? (
                                                        <input
                                                            className="inline-input"
                                                            autoFocus
                                                            onBlur={() => setEditingField(null)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleFieldUpdate(t.id, 'subCategory', e.target.value);
                                                                if (e.key === 'Escape') setEditingField(null);
                                                            }}
                                                            defaultValue={t.subCategory}
                                                            placeholder="Add subcategory..."
                                                        />
                                                    ) : (
                                                        <span
                                                            className={`editable-text sub ${!t.subCategory ? 'empty' : ''}`}
                                                            onClick={() => setEditingField({ id: t.id, field: 'subCategory' })}
                                                        >
                                                            {t.subCategory || '+ Add'}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={`tx-amount-col ${t.type}`}>
                                                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                                </div>

                                                <div className="tx-list-actions">
                                                    <button className="tx-del-btn" onClick={() => handleDelete(t.id)}>
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="no-tx-empty">
                        <div className="empty-icon-v1">📂</div>
                        <p>No transactions found for this period</p>
                    </div>
                )}
            </div>

            {/* Summary Panel at the bottom */}
            <div className="bottom-summary-panel">
                <div className="summary-item plus">
                    <span className="sum-label">Income</span>
                    <span className="sum-value">{formatCurrency(summary.income)}</span>
                </div>
                <div className="summary-item minus">
                    <span className="sum-label">Expense</span>
                    <span className="sum-value">{formatCurrency(summary.expense)}</span>
                </div>
                <div className="summary-item balance">
                    <span className="sum-label">Net Balance</span>
                    <span className="sum-value bold">{formatCurrency(summary.balance)}</span>
                </div>
            </div>
        </div>
    );
}
