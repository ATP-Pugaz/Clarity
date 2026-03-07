// Mock transaction data for Money Manager

// Generate dates for current and previous months
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

function createDate(day, monthOffset = 0) {
    const date = new Date(currentYear, currentMonth + monthOffset, day);
    date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
    return date.toISOString();
}

// Sample transactions
export const mockTransactions = [
    // Current month transactions
    { id: '1', type: 'income', amount: 45000, category: 'salary', description: 'Monthly Salary - December', date: createDate(1), source: 'sms', status: 'confirmed' },
    { id: '2', type: 'expense', amount: 2500, category: 'food', description: 'Grocery - Big Bazaar', date: createDate(2), source: 'upi', status: 'confirmed' },
    { id: '3', type: 'expense', amount: 450, category: 'food', description: 'Swiggy Order', date: createDate(3), source: 'upi', status: 'confirmed' },
    { id: '4', type: 'expense', amount: 1200, category: 'transport', description: 'Petrol', date: createDate(4), source: 'upi', status: 'confirmed' },
    { id: '5', type: 'expense', amount: 299, category: 'entertainment', description: 'Netflix Subscription', date: createDate(5), source: 'sms', status: 'confirmed' },
    { id: '6', type: 'expense', amount: 850, category: 'utilities', description: 'Electricity Bill', date: createDate(6), source: 'upi', status: 'confirmed' },
    { id: '7', type: 'expense', amount: 500, category: 'food', description: 'Restaurant - Dinner', date: createDate(7), source: 'upi', status: 'confirmed' },
    { id: '8', type: 'income', amount: 5000, category: 'freelance', description: 'Freelance Project Payment', date: createDate(8), source: 'sms', status: 'confirmed' },
    { id: '9', type: 'expense', amount: 3500, category: 'shopping', description: 'Amazon - Electronics', date: createDate(9), source: 'upi', status: 'confirmed' },
    { id: '10', type: 'expense', amount: 150, category: 'food', description: 'Zomato Order', date: createDate(10), source: 'upi', status: 'confirmed' },
    { id: '11', type: 'expense', amount: 2000, category: 'health', description: 'Medicine - Apollo Pharmacy', date: createDate(11), source: 'upi', status: 'confirmed' },
    { id: '12', type: 'expense', amount: 800, category: 'transport', description: 'Ola Ride', date: createDate(12), source: 'upi', status: 'confirmed' },
    { id: '13', type: 'expense', amount: 199, category: 'entertainment', description: 'Spotify Premium', date: createDate(13), source: 'sms', status: 'confirmed' },
    { id: '14', type: 'expense', amount: 600, category: 'food', description: 'Cafe Coffee Day', date: createDate(14), source: 'manual', status: 'confirmed' },
    { id: '15', type: 'expense', amount: 250, category: 'food', description: 'Swiggy Order', date: createDate(14), source: 'upi', status: 'pending' },

    // Previous month transactions
    { id: '16', type: 'income', amount: 45000, category: 'salary', description: 'Monthly Salary - November', date: createDate(1, -1), source: 'sms', status: 'confirmed' },
    { id: '17', type: 'expense', amount: 3200, category: 'food', description: 'Grocery - DMart', date: createDate(3, -1), source: 'upi', status: 'confirmed' },
    { id: '18', type: 'expense', amount: 1500, category: 'transport', description: 'Petrol', date: createDate(5, -1), source: 'upi', status: 'confirmed' },
    { id: '19', type: 'expense', amount: 5000, category: 'shopping', description: 'Myntra - Clothing', date: createDate(8, -1), source: 'upi', status: 'confirmed' },
    { id: '20', type: 'expense', amount: 750, category: 'entertainment', description: 'Movie Tickets - PVR', date: createDate(10, -1), source: 'upi', status: 'confirmed' },
    { id: '21', type: 'expense', amount: 1200, category: 'utilities', description: 'Internet Bill', date: createDate(12, -1), source: 'sms', status: 'confirmed' },
    { id: '22', type: 'income', amount: 3000, category: 'gift', description: 'Birthday Gift', date: createDate(15, -1), source: 'manual', status: 'confirmed' },
    { id: '23', type: 'expense', amount: 8000, category: 'shopping', description: 'Flipkart - Phone Accessories', date: createDate(18, -1), source: 'upi', status: 'confirmed' },
    { id: '24', type: 'expense', amount: 2500, category: 'food', description: 'Grocery', date: createDate(20, -1), source: 'upi', status: 'confirmed' },
    { id: '25', type: 'expense', amount: 1000, category: 'health', description: 'Doctor Consultation', date: createDate(22, -1), source: 'manual', status: 'confirmed' },
    { id: '26', type: 'expense', amount: 600, category: 'transport', description: 'Uber Rides', date: createDate(25, -1), source: 'upi', status: 'confirmed' },
    { id: '27', type: 'income', amount: 8000, category: 'freelance', description: 'Web Design Project', date: createDate(28, -1), source: 'sms', status: 'confirmed' },
];

// Budget categories with limits
export const mockBudgets = [
    { id: '1', category: 'food', limit: 8000, name: 'Food & Dining' },
    { id: '2', category: 'transport', limit: 3000, name: 'Transportation' },
    { id: '3', category: 'shopping', limit: 5000, name: 'Shopping' },
    { id: '4', category: 'entertainment', limit: 2000, name: 'Entertainment' },
    { id: '5', category: 'utilities', limit: 3000, name: 'Utilities' },
    { id: '6', category: 'health', limit: 3000, name: 'Health' },
    { id: '7', category: 'education', limit: 2000, name: 'Education' },
    { id: '8', category: 'other', limit: 2000, name: 'Others' },
];

// User settings
export const defaultSettings = {
    userName: 'User',
    currency: 'INR',
    autoSync: {
        upi: true,
        sms: true
    },
    notifications: {
        budgetAlerts: true,
        dailySummary: false,
        unusualSpending: true
    },
    theme: 'dark'
};

// AI Insights templates
export const insightTemplates = [
    { type: 'spending_increase', template: 'Your {category} spending increased {percent}% this month (₹{amount})' },
    { type: 'savings_track', template: "You're on track to save ₹{amount} by month-end" },
    { type: 'unusual', template: 'Unusual spending detected: {category} +₹{amount}' },
    { type: 'highest_day', template: 'Your highest spending day was {date} with ₹{amount} spent' },
    { type: 'budget_alert', template: '{category} category is at {percent}% of budget' },
    { type: 'auto_sync', template: '{count} transactions auto-synced from {source}' },
];

// Default categories with subcategories
export const defaultCategories = [
    {
        id: '1',
        name: 'Food & Dining',
        icon: '🍔',
        type: 'expense',
        subcategories: [
            { id: '1a', name: 'Groceries', icon: '🛒' },
            { id: '1b', name: 'Restaurants', icon: '🍽️' },
            { id: '1c', name: 'Food Delivery', icon: '🛵' }
        ]
    },
    {
        id: '2',
        name: 'Transportation',
        icon: '🚗',
        type: 'expense',
        subcategories: [
            { id: '2a', name: 'Fuel', icon: '⛽' },
            { id: '2b', name: 'Public Transport', icon: '🚌' },
            { id: '2c', name: 'Cab/Taxi', icon: '🚕' }
        ]
    },
    {
        id: '3',
        name: 'Shopping',
        icon: '🛍️',
        type: 'expense',
        subcategories: [
            { id: '3a', name: 'Clothes', icon: '👕' },
            { id: '3b', name: 'Electronics', icon: '📱' },
            { id: '3c', name: 'Home Items', icon: '🏠' }
        ]
    },
    {
        id: '4',
        name: 'Entertainment',
        icon: '🎬',
        type: 'expense',
        subcategories: [
            { id: '4a', name: 'Movies', icon: '🎥' },
            { id: '4b', name: 'Subscriptions', icon: '📺' },
            { id: '4c', name: 'Games', icon: '🎮' }
        ]
    },
    {
        id: '5',
        name: 'Utilities',
        icon: '💡',
        type: 'expense',
        subcategories: [
            { id: '5a', name: 'Electricity', icon: '⚡' },
            { id: '5b', name: 'Water', icon: '💧' },
            { id: '5c', name: 'Internet', icon: '📶' }
        ]
    },
    {
        id: '6',
        name: 'Health',
        icon: '💊',
        type: 'expense',
        subcategories: [
            { id: '6a', name: 'Medicine', icon: '💉' },
            { id: '6b', name: 'Doctor', icon: '👨‍⚕️' },
            { id: '6c', name: 'Gym', icon: '🏋️' }
        ]
    },
    {
        id: '7',
        name: 'Salary',
        icon: '💰',
        type: 'income',
        subcategories: [
            { id: '7a', name: 'Monthly', icon: '🗓️' },
            { id: '7b', name: 'Bonus', icon: '🎉' },
            { id: '7c', name: 'Reimbursement', icon: '📎' }
        ]
    },
    {
        id: '8',
        name: 'Freelance',
        icon: '💻',
        type: 'income',
        subcategories: [
            { id: '8a', name: 'Project', icon: '📁' },
            { id: '8b', name: 'Upwork', icon: '🌐' },
            { id: '8c', name: 'Hourly', icon: '⏱️' }
        ]
    },
    {
        id: '9',
        name: 'Other',
        icon: '📦',
        type: 'expense',
        subcategories: []
    }
];

// Default Payment Modes
export const defaultPaymentModes = [
    { id: '1', name: 'Bank Account', icon: '🏦', description: 'Direct bank transfer' },
    { id: '2', name: 'Cash', icon: '💵', description: 'Cash payment' },
    { id: '3', name: 'UPI', icon: '📱', description: 'GPay, PhonePe, Paytm, etc.' },
    { id: '4', name: 'Credit Card', icon: '💳', description: 'Credit card payment' },
    { id: '5', name: 'Debit Card', icon: '💳', description: 'Debit card payment' }
];
