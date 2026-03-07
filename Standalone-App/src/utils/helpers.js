// Helper functions for Money Manager

/**
 * Get time-based greeting
 */
export function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount) {
    const absAmount = Math.abs(amount || 0);
    // Show decimals only if the amount has fractional cents (e.g. 51.92 → ₹51.92, 500 → ₹500)
    const hasFraction = absAmount !== Math.floor(absAmount);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2
    }).format(absAmount);
}


/**
 * Get days in a month
 */
export function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get first day of month (0 = Sunday)
 */
export function getFirstDayOfMonth(month, year) {
    return new Date(year, month, 1).getDay();
}

/**
 * Format date for display
 */
export function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(new Date(date));
}

/**
 * Format time for display
 */
export function formatTime(date) {
    return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(date));
}

/**
 * Get month name
 */
export function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
}

/**
 * Get short month name
 */
export function getShortMonthName(month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
}

/**
 * Category Icons (SVG paths)
 */
export const categoryIcons = {
    'Food & Dining': '🍔',
    'Shopping': '🛍️',
    'Transportation': '🚗',
    'Utilities': '💡',
    'Salary': '💰',
    'Investment': '📈',
    'Medical': '💊',
    'Transfer': '↔️',
    'Other': '📦',
    // Fallbacks for older keys
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    utilities: '💡',
    salary: '💰',
    investment: '📈',
    health: '💊',
    medical: '💊',
    transfer: '↔️',
    other: '📦'
};

/**
 * Category Colors
 */
export const categoryColors = {
    'Food & Dining': '#ff7043',
    'Shopping': '#ab47bc',
    'Transportation': '#42a5f5',
    'Utilities': '#ffca28',
    'Salary': '#00e676',
    'Investment': '#66bb6a',
    'Medical': '#26a69a',
    'Transfer': '#78909c',
    'Other': '#8d6e63'
};

/**
 * Source badges
 */
export const sourceBadges = {
    manual: { label: 'Manual', color: '#78909c' },
    upi: { label: 'UPI', color: '#00bcd4' },
    sms: { label: 'Bank SMS', color: '#7c4dff' }
};

/**
 * Check if same day
 */
export function isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

/**
 * Check if today
 */
export function isToday(date) {
    return isSameDay(date, new Date());
}

/**
 * Get percentage change
 */
export function getPercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

/**
 * Generate unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Group transactions by date
 */
export function groupTransactionsByDate(transactions) {
    return transactions.reduce((groups, transaction) => {
        const date = new Date(transaction.date).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {});
}

/**
 * Calculate daily totals
 */
export function calculateDailyTotals(transactions) {
    const totals = {};
    transactions.forEach(t => {
        const dateKey = new Date(t.date).toDateString();
        if (!totals[dateKey]) {
            totals[dateKey] = { income: 0, expense: 0, net: 0 };
        }
        if (t.type === 'income') {
            totals[dateKey].income += t.amount;
        } else {
            totals[dateKey].expense += t.amount;
        }
        totals[dateKey].net = totals[dateKey].income - totals[dateKey].expense;
    });
    return totals;
}
