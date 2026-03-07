import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockBudgets, defaultSettings, defaultCategories, defaultPaymentModes, mockTransactions } from '../data/mockData';
import { parseExcel } from '../services/excelParser';

const AppContext = createContext();

export function useApp() {
    return useContext(AppContext);
}

export function AppProvider({ children }) {
    // UI State
    const [activeTab, setActiveTab] = useState('home');
    const [currentFilter, setCurrentFilter] = useState('monthly');
    const [currentOffset, setCurrentOffset] = useState(0);

    // Transactions State (Local Storage First)
    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('mm_transactions');
        return saved ? JSON.parse(saved) : mockTransactions;
    });

    // Period-based data (Calculated from transactions + UI state)
    const [periodData, setPeriodData] = useState({
        transactions: [],
        summary: { income: 0, expense: 0, balance: 0 },
        period: 'This Month',
        startDate: '',
        endDate: ''
    });

    // Local settings and categories (Persisted in LocalStorage)
    const [budgets, setBudgets] = useState(() => {
        const saved = localStorage.getItem('mm_budgets');
        return saved ? JSON.parse(saved) : mockBudgets;
    });

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('mm_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('mm_categories');
        return saved ? JSON.parse(saved) : defaultCategories;
    });

    const [paymentModes, setPaymentModes] = useState(() => {
        const saved = localStorage.getItem('mm_payment_modes');
        return saved ? JSON.parse(saved) : defaultPaymentModes;
    });

    // Helper to calculate period data locally
    const calculateLocalPeriodData = useCallback(() => {
        let startDate, endDate, periodLabel;
        const now = new Date();
        const offset = currentOffset;

        if (currentFilter === 'daily') {
            const target = new Date(now);
            target.setDate(now.getDate() + offset);
            startDate = new Date(target.setHours(0, 0, 0, 0));
            endDate = new Date(target.setHours(23, 59, 59, 999));
            periodLabel = target.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } else if (currentFilter === 'weekly') {
            const target = new Date(now);
            target.setDate(now.getDate() + (offset * 7));
            const day = target.getDay();
            const diff = target.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            startDate = new Date(new Date(target.setDate(diff)).setHours(0, 0, 0, 0));
            endDate = new Date(new Date(new Date(startDate).setDate(startDate.getDate() + 6)).setHours(23, 59, 59, 999));
            periodLabel = `${startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
        } else if (currentFilter === 'yearly') {
            const targetMonth = new Date(now.getFullYear() + offset, 0, 1);
            startDate = new Date(targetMonth.getFullYear(), 0, 1);
            endDate = new Date(targetMonth.getFullYear(), 11, 31, 23, 59, 59, 999);
            periodLabel = targetMonth.getFullYear().toString();
        } else {
            // Monthly
            const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
            startDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
            endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
            periodLabel = targetMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        }

        const filtered = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startDate && tDate <= endDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        setPeriodData({
            period: periodLabel,
            transactions: filtered,
            summary: {
                income,
                expense,
                balance: income - expense
            },
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
    }, [transactions, currentFilter, currentOffset]);

    // Local Persistence for Transactions
    useEffect(() => {
        localStorage.setItem('mm_transactions', JSON.stringify(transactions));
        calculateLocalPeriodData();
    }, [transactions, calculateLocalPeriodData]);

    // --- Standalone Sync Layer ---

    const fetchTransactions = useCallback(() => {
        calculateLocalPeriodData();
    }, [calculateLocalPeriodData]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const addTransaction = async (transaction) => {
        const newTx = {
            id: Date.now().toString(),
            date: transaction.date || new Date().toISOString(),
            category: transaction.category,
            subCategory: transaction.subCategory || transaction.subcategory,
            description: transaction.description || '',
            amount: parseFloat(transaction.amount),
            type: transaction.type,
            paymentMethod: transaction.paymentMethod || 'CASH',
            createdAt: new Date().toISOString()
        };

        setTransactions(prev => [...prev, newTx]);
    };

    const updateTransaction = async (id, updates) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTransaction = async (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const uploadFile = async (file) => {
        try {
            const data = await parseExcel(file);
            if (data.transactions && data.transactions.length > 0) {
                setTransactions(prev => [...prev, ...data.transactions]);
                // Merge new categories intelligently
                setCategories(prev => {
                    const newCats = [...prev];
                    data.categories.forEach(newCat => {
                        if (!newCats.find(c => c.name === newCat.name)) {
                            newCats.push({ id: Date.now().toString() + Math.random(), ...newCat });
                        }
                    });
                    return newCats;
                });
            }
            return data;
        } catch (error) {
            console.error(error);
            throw new Error('Import failed: ' + error.message);
        }
    };

    const clearAllData = async () => {
        setTransactions([]);
    };

    // --- Category Management (Local) ---
    const fetchCategories = async () => {
        return categories; // Used local states now
    };

    useEffect(() => { fetchCategories(); }, []);

    const addCategory = async (cat) => {
        setCategories(prev => [...prev, { id: Date.now().toString(), ...cat }]);
    };

    const deleteCategory = async (id) => {
        setCategories(prev => prev.filter(c => c.id !== id));
    };

    // --- Local Persistence (Settings/UI) ---

    useEffect(() => {
        localStorage.setItem('mm_budgets', JSON.stringify(budgets));
    }, [budgets]);

    useEffect(() => {
        localStorage.setItem('mm_settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem('mm_categories', JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem('mm_payment_modes', JSON.stringify(paymentModes));
    }, [paymentModes]);

    const deleteSubcategory = (catId, subId) => {
        setCategories(prev => prev.map(c =>
            c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c
        ));
    };

    const addSubcategory = (categoryId, sub) => {
        setCategories(prev => prev.map(c =>
            c.id === categoryId ? { ...c, subcategories: [...(c.subcategories || []), { id: Date.now().toString(), ...sub }] } : c
        ));
    };

    const updateBudget = (id, limit) => {
        setBudgets(prev => prev.map(b => b.id === id ? { ...b, limit } : b));
    };

    const addBudget = (categoryId, categoryName) => {
        setBudgets(prev => [...prev, { id: Date.now().toString(), categoryId, name: categoryName, limit: 1000 }]);
    };

    const deleteBudget = (id) => setBudgets(prev => prev.filter(b => b.id !== id));

    const value = {
        currentFilter,
        currentOffset,
        periodData,
        activeTab,
        budgets,
        settings,
        categories,
        paymentModes,
        setCurrentFilter,
        setCurrentOffset,
        setActiveTab,
        setSettings,
        fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        uploadFile,
        clearAllData,
        navigatePeriod: (dir) => setCurrentOffset(prev => prev + dir),
        resetPeriod: () => setCurrentOffset(0),
        addCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory,
        updateBudget,
        addBudget,
        deleteBudget,
        addPaymentMode: (mode) => setPaymentModes(prev => [...prev, { id: Date.now().toString(), ...mode }]),
        deletePaymentMode: (id) => setPaymentModes(prev => prev.filter(m => m.id !== id))
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
