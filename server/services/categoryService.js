const categoryRules = [
    {
        keywords: ['netflix', 'prime', 'hotstar', 'spotify'],
        category: 'Entertainment',
        subCategory: 'OTT',
        icon: '🎬'
    },
    {
        keywords: ['amazon', 'flipkart', 'myntra'],
        category: 'Shopping',
        subCategory: 'Online Shopping',
        icon: '🛍️'
    },
    {
        keywords: ['recharge', 'airtel', 'jio', 'vodafone'],
        category: 'Recharge',
        subCategory: 'Mobile Recharge',
        icon: '📱'
    },
    {
        keywords: ['swiggy', 'zomato', 'restaurant', 'fast food', 'dining', 'cafe'],
        category: 'Food',
        subCategory: 'Dining',
        icon: '🍔'
    },
    // General keywords for broader categories
    {
        keywords: ['ola', 'uber', 'cab', 'auto', 'fuel', 'petrol'],
        category: 'Transportation',
        subCategory: 'Cab/Fuel',
        icon: '🚗'
    },
    {
        keywords: ['salary', 'credit', 'payroll'],
        category: 'Salary',
        subCategory: 'Monthly',
        icon: '💰',
        type: 'income'
    },
    {
        keywords: ['freelance', 'project', 'client'],
        category: 'Freelance',
        subCategory: 'Project',
        icon: '💻',
        type: 'income'
    },
    {
        keywords: ['cashback', 'reward', 'refund', 'gift'],
        category: 'Gifts/Rewards',
        subCategory: 'Cashback',
        icon: '🎁',
        type: 'income'
    }
];

const getCategoryInfo = (text, type = 'expense') => {
    const lowerText = String(text || '').toLowerCase();

    // Check specific rules
    for (const rule of categoryRules) {
        if (rule.keywords.some(kw => lowerText.includes(kw))) {
            return {
                category: rule.category,
                subCategory: rule.subCategory,
                icon: rule.icon,
                type: rule.type || 'expense'
            };
        }
    }

    // Default Fallback based on type
    if (type === 'income' || ['salary', 'credit', 'payroll'].some(kw => lowerText.includes(kw))) {
        return {
            category: 'Income',
            subCategory: 'Other',
            icon: '💰',
            type: 'income'
        };
    }

    return {
        category: 'Transfer',
        subCategory: 'Other',
        icon: '📦',
        type: 'expense'
    };
};

module.exports = { getCategoryInfo };
