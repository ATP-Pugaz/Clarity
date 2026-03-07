import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { mockBudgets, defaultSettings, defaultCategories, defaultPaymentModes, mockTransactions } from '../data/mockData';

const AppContext = createContext();
const LOCAL_IP = '192.168.43.247'; // Use your machine's IP for Android connection
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `http://${LOCAL_IP}:5000/api`;

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

    // Supabase subscription and profile info
    const [userSubscription, setUserSubscription] = useState({
        isPremium: false,
        isTrial: false,
        status: 'none'
    });
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.error("Session fetch error:", sessionError);
                return;
            }

            if (session?.user) {
                // Fetch Subscription
                const { data: subData } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();

                if (subData) {
                    const isTrialActive = subData.subscription_status === 'trialing' && new Date(subData.trial_end_date) > new Date();
                    setUserSubscription({
                        isPremium: subData.subscription_status === 'active',
                        isTrial: isTrialActive,
                        status: subData.subscription_status
                    });
                }

                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('users')
                    .select('username, email, mobile')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setUserProfile(profileData);
                } else if (session.user.user_metadata) {
                    // Fallback to metadata
                    setUserProfile({
                        username: session.user.user_metadata.username,
                        email: session.user.email,
                        mobile: session.user.user_metadata.phone
                    });
                }
            } else {
                setUserProfile(null);
            }
        };

        fetchUserData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUserData();
        });

        return () => subscription.unsubscribe();
    }, []);

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

    // --- API Calls (Sync Layer) ---

    const fetchTransactions = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/transactions?filter=${currentFilter}&offset=${currentOffset}`);
            if (!response.ok) {
                calculateLocalPeriodData(); // Fallback
                return;
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                calculateLocalPeriodData();
                return;
            }
            const data = await response.json();
            // Sync logic: update local if backend has more/different data
            // For now, we'll just use the backend data for the periodData view
            setPeriodData(data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            calculateLocalPeriodData(); // Essential fallback for "Month not visible"
        }
    }, [currentFilter, currentOffset, calculateLocalPeriodData]);

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

        // 1. Update Local Immediately (fixes "Transaction not adding")
        setTransactions(prev => [...prev, newTx]);

        // 2. Try Backend Sync
        try {
            const response = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTx)
            });
            if (response.ok) {
                // If backend confirmed, we could optionally refresh
                // fetchTransactions(); 
            }
        } catch (error) {
            console.warn('Sync failed, transaction saved locally only.');
        }
    };

    const updateTransaction = async (id, updates) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        try {
            await fetch(`${API_BASE}/transactions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (error) { console.error('Update sync failed'); }
    };

    const deleteTransaction = async (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        try {
            await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
        } catch (error) { console.error('Delete sync failed'); }
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${API_BASE}/transactions/import`, { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                // Merge imported transactions locally
                if (data.transactions) {
                    setTransactions(prev => [...prev, ...data.transactions]);
                }
                fetchCategories();
                return data;
            }
            throw new Error(data.error || 'Import failed');
        } catch (error) { throw error; }
    };

    const clearAllData = async () => {
        setTransactions([]);
        try {
            await fetch(`${API_BASE}/transactions/clear`, { method: 'DELETE' });
        } catch (error) { console.error(error); }
    };

    // --- Category Management (Backend) ---
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE}/categories`);
            if (!response.ok) return; // silently fall back to default categories
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) return;
            const data = await response.json();
            setCategories(data);
        } catch (error) { console.error('fetchCategories error:', error); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const addCategory = async (cat) => {
        try {
            const response = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cat)
            });
            if (response.ok) fetchCategories();
        } catch (error) { console.error(error); }
    };

    const deleteCategory = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
            if (response.ok) fetchCategories();
        } catch (error) { console.error(error); }
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
        userSubscription,
        userProfile,
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
