import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import './Calendar.css';

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

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
    const { periodData, categories } = useApp();

    const transactions = periodData?.transactions || [];

    const today = new Date();
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();

    const getCategoryIcon = (name) =>
        categories.find(c => c.name === name)?.icon || '📦';

    // Get transactions for a specific calendar day
    const getDayTransactions = (day) => {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return transactions.filter(t => t.date && t.date.startsWith(dateStr));
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const selectedDayTxns = selectedDate ? getDayTransactions(selectedDate) : [];
    const selectedIncome = selectedDayTxns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const selectedExpense = selectedDayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

    // Monthly stats
    const daysWithTxns = new Set(
        transactions.map(t => t.date && t.date.slice(0, 10)).filter(Boolean)
    ).size;

    const maxDailyExpense = (() => {
        const daily = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const d = t.date?.slice(0, 10);
            if (d) daily[d] = (daily[d] || 0) + (t.amount || 0);
        });
        return Math.max(...Object.values(daily), 0);
    })();

    const avgDailyExpense = daysInMonth > 0
        ? transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0) / daysInMonth
        : 0;

    return (
        <div className="calendar-container">
            <h2 className="calendar-title">📅 Calendar View</h2>

            {/* Calendar header */}
            <div className="full-calendar">
                <div className="full-calendar-header">
                    <button className="calendar-nav-btn" onClick={prevMonth}><ChevronLeft /></button>
                    <span className="calendar-month-title">
                        {monthNames[viewMonth]} {viewYear}
                    </span>
                    <button className="calendar-nav-btn" onClick={nextMonth}><ChevronRight /></button>
                </div>

                <div className="full-calendar-grid">
                    {/* Day headers */}
                    {dayNames.map(d => (
                        <div key={d} className="full-calendar-day-name">{d}</div>
                    ))}

                    {/* Empty cells */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e-${i}`} className="full-calendar-day empty other-month" />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayTxns = getDayTransactions(day);
                        const hasIncome = dayTxns.some(t => t.type === 'income');
                        const hasExpense = dayTxns.some(t => t.type === 'expense');
                        const isTodayDate = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
                        const isSelected = selectedDate === day;

                        return (
                            <button
                                key={day}
                                className={`full-calendar-day ${isTodayDate ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => setSelectedDate(isSelected ? null : day)}
                            >
                                <span className="day-number">{day}</span>
                                {dayTxns.length > 0 && (
                                    <div className="day-indicators">
                                        {hasIncome && <span className="day-indicator income" />}
                                        {hasExpense && <span className="day-indicator expense" />}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <div className="legend-item"><span className="legend-dot income" /><span>Income</span></div>
                <div className="legend-item"><span className="legend-dot expense" /><span>Expense</span></div>
            </div>

            {/* Selected day detail */}
            {selectedDate && (
                <div className="day-detail-panel">
                    <div className="day-detail-title">
                        <span>{monthNames[viewMonth]} {selectedDate}, {viewYear}</span>
                        <button className="close-detail-btn" onClick={() => setSelectedDate(null)}>×</button>
                    </div>
                    <div className="day-totals">
                        <div className="day-total-item">
                            <div className="day-total-label">Income</div>
                            <div className="day-total-amount income">{formatCurrency(selectedIncome)}</div>
                        </div>
                        <div className="day-total-item">
                            <div className="day-total-label">Expenses</div>
                            <div className="day-total-amount expense">{formatCurrency(selectedExpense)}</div>
                        </div>
                        <div className="day-total-item">
                            <div className="day-total-label">Net</div>
                            <div className="day-total-amount net">{formatCurrency(selectedIncome - selectedExpense)}</div>
                        </div>
                    </div>

                    {selectedDayTxns.length > 0 ? (
                        <div className="transaction-list">
                            {selectedDayTxns.map(t => (
                                <div key={t.id} className="transaction-item">
                                    <span className="transaction-icon">{getCategoryIcon(t.category)}</span>
                                    <div className="transaction-details">
                                        <div className="transaction-name">{t.description || t.category || 'Transaction'}</div>
                                        <div className="transaction-meta">
                                            <span>{t.category}</span>
                                            <span className={`transaction-source ${t.paymentMethod || ''}`}>{t.paymentMethod || 'CASH'}</span>
                                        </div>
                                    </div>
                                    <span className={`transaction-amount ${t.type}`}>
                                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted text-center">No transactions on this day</p>
                    )}
                </div>
            )}

            {/* Monthly stats */}
            <div className="calendar-stats">
                <div className="calendar-stat-card">
                    <div className="stat-value">{daysWithTxns}</div>
                    <div className="stat-label">Active Days</div>
                </div>
                <div className="calendar-stat-card">
                    <div className="stat-value">{formatCurrency(maxDailyExpense)}</div>
                    <div className="stat-label">Highest Day</div>
                </div>
                <div className="calendar-stat-card">
                    <div className="stat-value">{formatCurrency(avgDailyExpense)}</div>
                    <div className="stat-label">Avg Daily</div>
                </div>
            </div>
        </div>
    );
}
