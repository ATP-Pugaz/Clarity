import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SMSParser } from '../../utils/smsParser';

export default function TransactionModal({ isOpen, onClose, editingTransaction = null, initialData = {} }) {
    const {
        addTransaction,
        updateTransaction,
        categories,
        paymentModes,
        periodData
    } = useApp();

    const [newTx, setNewTx] = useState({
        type: 'expense',
        amount: '',
        category: 'Food & Dining',
        subCategory: '',
        description: '',
        paymentMethod: 'CASH',
        source: 'manual',
        date: new Date().toISOString().split('T')[0],
        referenceId: ''
    });

    const transactions = periodData.transactions || [];

    // Reset or Fill form when modal opens or editing changes
    useEffect(() => {
        if (isOpen) {
            if (editingTransaction) {
                const date = new Date(editingTransaction.date);
                setNewTx({
                    type: editingTransaction.type,
                    amount: editingTransaction.amount.toString(),
                    category: editingTransaction.category,
                    subCategory: editingTransaction.subCategory || '',
                    description: editingTransaction.description,
                    paymentMethod: editingTransaction.paymentMethod || 'CASH',
                    source: editingTransaction.source || 'manual',
                    date: date.toISOString().split('T')[0],
                    referenceId: editingTransaction.referenceId || ''
                });
            } else {
                setNewTx({
                    type: 'expense',
                    amount: '',
                    category: 'Food & Dining',
                    subCategory: '',
                    description: '',
                    paymentMethod: 'CASH',
                    source: 'manual',
                    date: initialData.date || new Date().toISOString().split('T')[0],
                    referenceId: ''
                });
            }
        }
    }, [isOpen, editingTransaction, initialData]);

    const resetForm = () => {
        setNewTx({
            type: 'expense',
            amount: '',
            category: 'Food & Dining',
            subCategory: '',
            description: '',
            paymentMethod: 'CASH',
            source: 'manual',
            date: new Date().toISOString().split('T')[0],
            referenceId: ''
        });
    };

    const handleTypeChange = (type) => {
        const newCategories = categories?.filter(c => c.type === type) || [];
        const firstCategory = newCategories[0]?.name || 'Other';
        const firstCatObj = newCategories[0];
        const firstSub = firstCatObj?.subcategories?.[0]?.name || '';

        setNewTx({
            ...newTx,
            type,
            category: firstCategory,
            subCategory: firstSub
        });
    };

    const handleCategoryChange = (val) => {
        const catObj = categories?.find(c => c.name === val);
        const firstSub = catObj?.subcategories?.[0]?.name || '';
        setNewTx({ ...newTx, category: val, subCategory: firstSub });
    };

    const checkDuplicate = (minTx) => {
        const newHash = SMSParser.generateHash(minTx);
        return transactions.some(t => {
            const existingHash = SMSParser.generateHash(t);
            return existingHash === newHash;
        });
    };

    const handlePasteSMS = async () => {
        try {
            let text = '';
            try {
                text = await navigator.clipboard.readText();
            } catch (permErr) {
                text = prompt('Paste your SMS here:');
            }

            if (!text) return;

            const parsed = SMSParser.parse(text);
            if (parsed) {
                const isDuplicate = checkDuplicate(parsed);
                if (isDuplicate) {
                    const proceed = confirm('⚠️ Duplicate Transaction Detected!\nProceed anyway?');
                    if (!proceed) return;
                }

                setNewTx({
                    ...newTx,
                    type: parsed.type,
                    amount: parsed.amount.toString(),
                    description: parsed.description,
                    paymentMethod: parsed.paymentMethod?.toUpperCase() || 'ACC',
                    date: parsed.date.split('T')[0],
                    source: 'sms_parser',
                    referenceId: parsed.referenceId || ''
                });
                alert('✅ SMS parsed successfully!');
            } else {
                alert('❌ Could not detect a valid transaction.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newTx.amount || !newTx.description) return;

        const now = new Date();
        const selectedDate = new Date(newTx.date);
        selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        const txData = {
            ...newTx,
            amount: parseFloat(newTx.amount),
            date: selectedDate.toISOString()
        };

        if (editingTransaction) {
            await updateTransaction(editingTransaction.id, txData);
        } else {
            await addTransaction(txData);
        }

        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const filteredCategories = categories?.filter(c => c.type === newTx.type) || [];
    const currentCategory = categories?.find(c => c.name === newTx.category);
    const subcategoriesList = currentCategory?.subcategories || [];

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 className="modal-title">{editingTransaction ? 'Edit' : 'Add'} Transaction</h3>
                        {!editingTransaction && (
                            <button type="button" onClick={handlePasteSMS} className="paste-sms-btn-small">
                                ✨ Paste SMS
                            </button>
                        )}
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form className="modal-body" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <div className="type-toggle">
                            <button
                                type="button"
                                className={`type-btn expense ${newTx.type === 'expense' ? 'active' : ''}`}
                                onClick={() => handleTypeChange('expense')}
                            >Expense</button>
                            <button
                                type="button"
                                className={`type-btn income ${newTx.type === 'income' ? 'active' : ''}`}
                                onClick={() => handleTypeChange('income')}
                            >Income</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input type="date" className="form-input" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount (₹)</label>
                        <input type="number" className="form-input" placeholder="0.00" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input type="text" className="form-input" placeholder="What's this for?" value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-input" value={newTx.category} onChange={(e) => handleCategoryChange(e.target.value)}>
                            {filteredCategories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                            ))}
                            <option value="Other">📦 Other</option>
                        </select>
                    </div>

                    {subcategoriesList.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Subcategory</label>
                            <select className="form-input" value={newTx.subCategory} onChange={(e) => setNewTx({ ...newTx, subCategory: e.target.value })}>
                                <option value="">Select Subcategory</option>
                                {subcategoriesList.map(sub => (
                                    <option key={sub.id} value={sub.name}>{sub.icon} {sub.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Payment Method</label>
                        <select className="form-input" value={newTx.paymentMethod} onChange={(e) => setNewTx({ ...newTx, paymentMethod: e.target.value })}>
                            <option value="CASH">💵 Cash</option>
                            <option value="UPI">📱 UPI</option>
                            <option value="ACC">🏦 Account Transfer</option>
                            <option value="CARD">💳 Card</option>
                            {paymentModes?.map(mode => (
                                <option key={mode.id} value={mode.name.toUpperCase()}>{mode.icon} {mode.name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="submit-btn" style={{ marginTop: '10px' }}>
                        {editingTransaction ? 'Save Changes' : 'Add Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
}
