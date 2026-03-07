import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import './Settings.css';

// Emoji picker options
const emojiOptions = ['🍔', '🚗', '🛍️', '🎬', '💡', '💊', '📚', '💰', '💻', '🎁', '🏠', '✈️', '🎮', '📱', '👕', '⛽', '🚌', '📦', '🏦', '💵', '💳'];

export default function Settings() {
    const {
        settings,
        setSettings,
        budgets,
        updateBudget,
        periodData,
        categories,
        addCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory,
        paymentModes,
        addPaymentMode,
        deletePaymentMode,
        addTransaction,
        uploadFile,
        clearAllData,
        addBudget,
        deleteBudget,
        userProfile
    } = useApp();

    const { transactions } = periodData;



    // Category modal state
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', icon: '📁', type: 'expense' });

    // Subcategory modal state
    const [showAddSubcategory, setShowAddSubcategory] = useState(null);
    const [newSubcategory, setNewSubcategory] = useState({ name: '', icon: '📁' });

    // Payment mode modal state
    const [showAddPaymentMode, setShowAddPaymentMode] = useState(false);
    const [newPaymentMode, setNewPaymentMode] = useState({ name: '', icon: '💳', description: '' });

    // Expanded category for viewing subcategories
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Category view mode (income / expense)
    const [categoryMode, setCategoryMode] = useState('expense');

    // Budget modal state
    const [showAddBudget, setShowAddBudget] = useState(false);
    const [newBudget, setNewBudget] = useState({ categoryName: '', limit: 5000 });

    // File input ref for import
    const fileInputRef = useRef(null);

    const toggleSetting = (path) => {
        const keys = path.split('.');
        setSettings(prev => {
            const newSettings = { ...prev };
            let current = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = !current[keys[keys.length - 1]];
            return newSettings;
        });
    };

    const handleBudgetChange = (id, value) => {
        const numValue = parseInt(value) || 0;
        updateBudget(id, numValue);
    };

    const handleClearData = async () => {
        if (confirm('⚠️ CRITICAL: This will clear ALL transaction and category data, but your account will stay logged in. PROCEED?')) {
            await clearAllData();
            // Clear specific data but KEEP mm_auth
            const keysToRemove = ['mm_budgets', 'mm_settings', 'mm_categories', 'mm_payment_modes'];
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // Reload to reset app state without logging out
            window.location.reload();
        }
    };

    // Toggle theme
    const toggleTheme = () => {
        setSettings(prev => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark'
        }));
    };

    // Export as Excel (Matching MoneyView Format)
    const handleExportExcel = async () => {
        try {
            // Sort transactions by date ascending for balance calculation
            const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

            let runningBalance = 0;
            const dataRows = sortedTransactions.map(t => {
                if (t.type === 'income') {
                    runningBalance += t.amount;
                } else {
                    runningBalance -= t.amount;
                }

                return {
                    'Date': new Date(t.date).toLocaleDateString('en-GB').replace(/\//g, '-'), // DD-MM-YYYY
                    'Category': t.category.charAt(0).toUpperCase() + t.category.slice(1).replace(/_/g, ' '),
                    'Subcategory': t.subcategory || '',
                    '': '', // Empty Column D
                    'Narration': t.description,
                    ' ': '', // Empty Column F
                    'Txn ID': t.id.slice(-8), // Dummy Txn ID from end of ID
                    '  ': '', // Empty Column H
                    'Credit': t.type === 'income' ? `Rs. ${t.amount.toFixed(2)}` : '',
                    'Debit': t.type === 'expense' ? `Rs. ${t.amount.toFixed(2)}` : '',
                    'Closing balance': `Rs. ${runningBalance.toFixed(2)}`
                };
            });

            // Re-sort to Newest First for the Excel sheet
            const finalRows = dataRows.reverse();

            // Create Workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(finalRows);

            // Set column widths for better look
            const wscols = [
                { wch: 12 }, // Date
                { wch: 15 }, // Category
                { wch: 15 }, // Subcategory
                { wch: 2 },  // D
                { wch: 40 }, // Narration
                { wch: 2 },  // F
                { wch: 10 }, // Txn ID
                { wch: 2 },  // H
                { wch: 12 }, // Credit
                { wch: 12 }, // Debit
                { wch: 15 }  // Closing Balance
            ];
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Transactions");

            // File Name
            const fileName = `Clarity_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'Excel File',
                        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
                    }]
                });
                const writable = await handle.createWritable();
                const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                await writable.write(buffer);
                await writable.close();
            } else {
                XLSX.writeFile(wb, fileName);
            }
            alert('✅ Export successful in MoneyView format!');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Export Error:', error);
                alert('❌ Export failed. Please try again.');
            }
        }
    };

    // Import Excel/PDF via Backend
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await uploadFile(file);
            alert(`✅ Successfully imported ${result.count || 0} transactions!`);
        } catch (error) {
            console.error('Import Error:', error);
            alert('❌ Import failed: ' + error.message);
        } finally {
            e.target.value = ''; // Reset input
        }
    };



    const handleAddCategory = () => {
        if (!newCategory.name.trim()) return;
        addCategory(newCategory);
        setNewCategory({ name: '', icon: '📁', type: 'expense' });
        setShowAddCategory(false);
    };

    const handleAddSubcategory = () => {
        if (!newSubcategory.name.trim() || !showAddSubcategory) return;
        addSubcategory(showAddSubcategory, newSubcategory);
        setNewSubcategory({ name: '', icon: '📁' });
        setShowAddSubcategory(null);
    };

    const handleAddPaymentMode = () => {
        if (!newPaymentMode.name.trim()) return;
        addPaymentMode(newPaymentMode);
        setNewPaymentMode({ name: '', icon: '💳', description: '' });
        setShowAddPaymentMode(false);
    };

    const handleDeleteCategory = (categoryId) => {
        if (confirm('Delete this category and all its subcategories?')) {
            deleteCategory(categoryId);
        }
    };

    const handleDeletePaymentMode = (modeId) => {
        if (confirm('Delete this payment mode?')) {
            deletePaymentMode(modeId);
        }
    };

    const handleAddBudget = () => {
        if (!newBudget.categoryName.trim()) return;
        addBudget(null, newBudget.categoryName);
        setNewBudget({ categoryName: '', limit: 5000 });
        setShowAddBudget(false);
    };

    const handleDeleteBudget = (budgetId) => {
        if (confirm('Delete this budget limit?')) {
            deleteBudget(budgetId);
        }
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    // Management section tabs (categories / payment modes / budgets)
    const [managementTab, setManagementTab] = useState('categories');

    return (
        <div className="settings-container">
            <h2 className="settings-title">⚙️ Settings</h2>

            {/* User Profile Section */}
            {userProfile && (
                <div className="settings-section" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '50px', height: '50px', background: 'var(--primary-color)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                            {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-color)' }}>{userProfile.username || 'User'}</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', opacity: 0.7 }}>📧 {userProfile.email}</p>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)', opacity: 0.7 }}>📱 {userProfile.mobile}</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.reload();
                        }}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Sign Out
                    </button>
                </div>
            )}

            {/* Management section tabs */}
            <div className="settings-management-tabs">
                <button
                    className={`settings-management-tab ${managementTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setManagementTab('categories')}
                >
                    Categories
                </button>
                <button
                    className={`settings-management-tab ${managementTab === 'paymentModes' ? 'active' : ''}`}
                    onClick={() => setManagementTab('paymentModes')}
                >
                    Payment Modes
                </button>
                <button
                    className={`settings-management-tab ${managementTab === 'budgets' ? 'active' : ''}`}
                    onClick={() => setManagementTab('budgets')}
                >
                    Monthly Budgets
                </button>
            </div>

            {/* Theme Toggle */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">🎨</span>
                    <span className="section-title">Appearance</span>
                </div>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Theme</span>
                            <span className="setting-description">
                                {settings.theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                            </span>
                        </div>
                        <button
                            className={`theme-toggle ${settings.theme}`}
                            onClick={toggleTheme}
                            title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            <span className="theme-toggle-track">
                                <span className="theme-toggle-thumb">
                                    {settings.theme === 'dark' ? '🌙' : '☀️'}
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>



            {/* Categories Section */}
            {managementTab === 'categories' && (
                <div className="settings-section">
                    <div className="section-header">
                        <span className="section-icon">🏷️</span>
                        <span className="section-title">Categories</span>
                        <button
                            className="add-category-btn"
                            onClick={() => setShowAddCategory(true)}
                        >
                            + Add
                        </button>
                    </div>

                    {/* Category mode toggle */}
                    <div className="category-mode-toggle">
                        <button
                            className={`category-mode-btn ${categoryMode === 'expense' ? 'active expense' : ''}`}
                            onClick={() => setCategoryMode('expense')}
                            type="button"
                        >
                            Expense
                        </button>
                        <button
                            className={`category-mode-btn ${categoryMode === 'income' ? 'active income' : ''}`}
                            onClick={() => setCategoryMode('income')}
                            type="button"
                        >
                            Income
                        </button>
                    </div>

                    {/* Expense Categories */}
                    {categoryMode === 'expense' && (
                        <div className="category-group">
                            <div className="category-group-title">Expense Categories</div>
                            <div className="category-list-items">
                                {expenseCategories.map(cat => (
                                    <div key={cat.id} className="category-card expense">
                                        <div
                                            className="category-card-header"
                                            onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                        >
                                            <span className="category-icon-large">{cat.icon}</span>
                                            <div className="category-card-info">
                                                <span className="category-card-name">{cat.name}</span>
                                                <span className="subcategory-count">
                                                    {cat.subcategories?.length || 0} subcategories
                                                </span>
                                            </div>
                                            <div className="category-card-actions">
                                                <button
                                                    className="add-sub-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowAddSubcategory(cat.id);
                                                        setNewSubcategory({ name: '', icon: cat.icon });
                                                    }}
                                                    title="Add subcategory"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    className="delete-cat-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCategory(cat.id);
                                                    }}
                                                    title="Delete category"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subcategories */}
                                        {expandedCategory === cat.id && cat.subcategories?.length > 0 && (
                                            <div className="subcategory-list">
                                                {cat.subcategories.map(sub => (
                                                    <div key={sub.id} className="subcategory-item">
                                                        <span className="subcategory-icon">{sub.icon}</span>
                                                        <span className="subcategory-name">{sub.name}</span>
                                                        <button
                                                            className="delete-sub-btn"
                                                            onClick={() => deleteSubcategory(cat.id, sub.id)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Income Categories */}
                    {categoryMode === 'income' && (
                        <div className="category-group">
                            <div className="category-group-title">Income Categories</div>
                            <div className="category-list-items">
                                {incomeCategories.map(cat => (
                                    <div key={cat.id} className="category-card income">
                                        <div
                                            className="category-card-header"
                                            onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                        >
                                            <span className="category-icon-large">{cat.icon}</span>
                                            <div className="category-card-info">
                                                <span className="category-card-name">{cat.name}</span>
                                                <span className="subcategory-count">
                                                    {cat.subcategories?.length || 0} subcategories
                                                </span>
                                            </div>
                                            <div className="category-card-actions">
                                                <button
                                                    className="add-sub-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowAddSubcategory(cat.id);
                                                        setNewSubcategory({ name: '', icon: cat.icon });
                                                    }}
                                                    title="Add subcategory"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    className="delete-cat-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCategory(cat.id);
                                                    }}
                                                    title="Delete category"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subcategories */}
                                        {expandedCategory === cat.id && cat.subcategories?.length > 0 && (
                                            <div className="subcategory-list">
                                                {cat.subcategories.map(sub => (
                                                    <div key={sub.id} className="subcategory-item">
                                                        <span className="subcategory-icon">{sub.icon}</span>
                                                        <span className="subcategory-name">{sub.name}</span>
                                                        <button
                                                            className="delete-sub-btn"
                                                            onClick={() => deleteSubcategory(cat.id, sub.id)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Payment Modes Section */}
            {managementTab === 'paymentModes' && (
                <div className="settings-section">
                    <div className="section-header">
                        <span className="section-icon">💳</span>
                        <span className="section-title">Payment Modes</span>
                        <button
                            className="add-category-btn"
                            onClick={() => setShowAddPaymentMode(true)}
                        >
                            + Add
                        </button>
                    </div>
                    <div className="payment-modes-list">
                        {paymentModes?.map(mode => (
                            <div key={mode.id} className="payment-mode-card">
                                <span className="payment-mode-icon">{mode.icon}</span>
                                <div className="payment-mode-info">
                                    <span className="payment-mode-name">{mode.name}</span>
                                    <span className="payment-mode-desc">{mode.description}</span>
                                </div>
                                <button
                                    className="delete-cat-btn"
                                    onClick={() => handleDeletePaymentMode(mode.id)}
                                    title="Delete payment mode"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Budget Limits */}
            {managementTab === 'budgets' && (
                <div className="settings-section">
                    <div className="section-header">
                        <span className="section-icon">💰</span>
                        <span className="section-title">Monthly Budget Limits</span>
                        <button
                            className="add-category-btn"
                            onClick={() => setShowAddBudget(true)}
                        >
                            + Add
                        </button>
                    </div>
                    <div className="budget-list">
                        {budgets.map(budget => (
                            <div key={budget.id} className="budget-item">
                                <div className="budget-details">
                                    <div className="budget-name">{budget.name}</div>
                                    <div className="budget-current">
                                        Limit: {formatCurrency(budget.limit)}
                                    </div>
                                </div>
                                <div className="budget-input-wrapper">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        className="budget-input"
                                        value={budget.limit}
                                        onChange={(e) => handleBudgetChange(budget.id, e.target.value)}
                                        min="0"
                                        step="500"
                                    />
                                    <button
                                        className="delete-cat-btn"
                                        onClick={() => handleDeleteBudget(budget.id)}
                                        title="Delete budget"
                                        style={{ marginLeft: '8px' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notification Settings */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">🔔</span>
                    <span className="section-title">Notifications</span>
                </div>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Budget Alerts</span>
                            <span className="setting-description">Notify when approaching budget limits</span>
                        </div>
                        <button
                            className={`toggle-switch ${settings.notifications?.budgetAlerts ? 'active' : ''}`}
                            onClick={() => toggleSetting('notifications.budgetAlerts')}
                        />
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Daily Summary</span>
                            <span className="setting-description">Daily spending summary notification</span>
                        </div>
                        <button
                            className={`toggle-switch ${settings.notifications?.dailySummary ? 'active' : ''}`}
                            onClick={() => toggleSetting('notifications.dailySummary')}
                        />
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="settings-section">
                <div className="section-header">
                    <span className="section-icon">💾</span>
                    <span className="section-title">Data Management</span>
                </div>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Total Transactions</span>
                            <span className="setting-description">Stored in your browser</span>
                        </div>
                        <span className="text-sky font-semibold">{transactions.length}</span>
                    </div>
                </div>
            </div>

            {/* Hidden file input for import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {/* Action Buttons */}
            <div className="action-buttons">
                <button className="action-btn secondary" onClick={handleImportClick}>
                    📥 Import Excel/CSV
                </button>
                <button className="action-btn primary" onClick={handleExportExcel}>
                    📊 Export Excel/CSV
                </button>
                <button className="action-btn danger" onClick={handleClearData}>
                    🗑️ Clear All Data
                </button>
            </div>

            {/* Version */}
            <div className="version-info">
                <strong>Clarity</strong> v1.0.0<br />
                Built with React + Vite<br />
                Premium Financial Tracking
            </div>

            {/* Add Category Modal */}
            {showAddCategory && (
                <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Category</h3>
                            <button className="modal-close" onClick={() => setShowAddCategory(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Category Type</label>
                                <div className="type-toggle">
                                    <button
                                        className={`type-btn expense ${newCategory.type === 'expense' ? 'active' : ''}`}
                                        onClick={() => setNewCategory({ ...newCategory, type: 'expense' })}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        className={`type-btn income ${newCategory.type === 'income' ? 'active' : ''}`}
                                        onClick={() => setNewCategory({ ...newCategory, type: 'income' })}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Icon</label>
                                <div className="emoji-picker">
                                    {emojiOptions.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={`emoji-option ${newCategory.icon === emoji ? 'selected' : ''}`}
                                            onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Travel, Education"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </div>
                            <button
                                className="submit-btn"
                                onClick={handleAddCategory}
                                disabled={!newCategory.name.trim()}
                            >
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subcategory Modal */}
            {showAddSubcategory && (
                <div className="modal-overlay" onClick={() => setShowAddSubcategory(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Subcategory</h3>
                            <button className="modal-close" onClick={() => setShowAddSubcategory(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Icon</label>
                                <div className="emoji-picker">
                                    {emojiOptions.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={`emoji-option ${newSubcategory.icon === emoji ? 'selected' : ''}`}
                                            onClick={() => setNewSubcategory({ ...newSubcategory, icon: emoji })}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subcategory Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Coffee, Snacks"
                                    value={newSubcategory.name}
                                    onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                                />
                            </div>
                            <button
                                className="submit-btn"
                                onClick={handleAddSubcategory}
                                disabled={!newSubcategory.name.trim()}
                            >
                                Add Subcategory
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Payment Mode Modal */}
            {showAddPaymentMode && (
                <div className="modal-overlay" onClick={() => setShowAddPaymentMode(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Payment Mode</h3>
                            <button className="modal-close" onClick={() => setShowAddPaymentMode(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Icon</label>
                                <div className="emoji-picker">
                                    {emojiOptions.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={`emoji-option ${newPaymentMode.icon === emoji ? 'selected' : ''}`}
                                            onClick={() => setNewPaymentMode({ ...newPaymentMode, icon: emoji })}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Mode Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., PhonePe, Google Pay"
                                    value={newPaymentMode.name}
                                    onChange={(e) => setNewPaymentMode({ ...newPaymentMode, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Primary UPI app"
                                    value={newPaymentMode.description}
                                    onChange={(e) => setNewPaymentMode({ ...newPaymentMode, description: e.target.value })}
                                />
                            </div>
                            <button
                                className="submit-btn"
                                onClick={handleAddPaymentMode}
                                disabled={!newPaymentMode.name.trim()}
                            >
                                Add Payment Mode
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
