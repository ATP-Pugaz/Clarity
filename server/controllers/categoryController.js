const { v4: uuidv4 } = require('uuid');

let categories = [
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

const getCategories = (req, res) => {
    res.json(categories);
};

const addCategory = (req, res) => {
    const { name, icon, type } = req.body;
    const newCat = {
        id: uuidv4(),
        name,
        icon,
        type,
        subcategories: []
    };
    categories.push(newCat);
    res.status(201).json(newCat);
};

const deleteCategory = (req, res) => {
    const { id } = req.params;
    categories = categories.filter(c => c.id !== id);
    res.json({ message: 'Category deleted' });
};

// Helper for internal use (import discovered categories)
const internalAddCategories = (newCats) => {
    newCats.forEach(nc => {
        const exists = categories.find(c => c.name.toLowerCase() === nc.name.toLowerCase());
        if (!exists) {
            categories.push({
                id: uuidv4(),
                ...nc,
                subcategories: []
            });
        }
    });
};

module.exports = {
    getCategories,
    addCategory,
    deleteCategory,
    internalAddCategories,
    categories // Exporting for usage in service if needed
};
