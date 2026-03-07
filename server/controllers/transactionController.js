const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const isBetween = require('dayjs/plugin/isBetween');

dayjs.extend(isBetween);

const { parseExcel } = require('../services/excelParser');
const { parsePDF } = require('../services/pdfParser');
const { exportToExcel, exportToPDF } = require('../services/exportService');
const { internalAddCategories } = require('./categoryController');

// Mock Database (Persistent in-memory for this session)
let db = [];

const importTransactions = async (req, res) => {
    console.log('--- Import Request Started ---');
    try {
        if (!req.file) {
            console.warn('No file received in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`File received: ${req.file.originalname}, size: ${req.file.size} bytes`);
        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();
        let result;

        console.log(`Parsing file with extension: ${ext}`);
        if (ext === '.xlsx' || ext === '.xls') {
            result = parseExcel(filePath);
        } else if (ext === '.pdf') {
            result = await parsePDF(filePath);
        } else {
            console.warn(`Unsupported extension: ${ext}`);
            return res.status(400).json({ error: 'Unsupported file format' });
        }

        console.log(`Parsing result: ${result.transactions.length} transactions, ${result.categories.length} categories`);

        // Integrate newly discovered categories
        if (result.categories && result.categories.length > 0) {
            console.log('Integrating categories...');
            internalAddCategories(result.categories);
        }

        console.log('Adding to database...');
        db = [...db, ...result.transactions];

        console.log('Deleting temporary file...');
        fs.unlinkSync(filePath);

        console.log('--- Import Request Completed Successfully ---');
        return res.json({
            count: result.transactions.length,
            transactions: result.transactions
        });
    } catch (error) {
        console.error('Import error logged:', error);
        res.status(500).json({ error: 'Error processing file: ' + error.message });
    }
};

const getTransactions = async (req, res) => {
    try {
        const { filter = 'monthly', offset = 0 } = req.query;
        const off = parseInt(offset) || 0;

        let startDate, endDate, periodLabel;
        const now = dayjs();

        if (filter === 'daily') {
            const target = now.add(off, 'day');
            startDate = target.startOf('day');
            endDate = target.endOf('day');
            periodLabel = target.format('DD MMM YYYY');
        } else if (filter === 'weekly') {
            const target = now.add(off, 'week');
            startDate = target.startOf('week');
            endDate = target.endOf('week');
            periodLabel = `${startDate.format('DD MMM')} - ${endDate.format('DD MMM')}`;
        } else if (filter === 'yearly') {
            const target = now.add(off, 'year');
            startDate = target.startOf('year');
            endDate = target.endOf('year');
            periodLabel = target.format('YYYY');
        } else {
            const target = now.add(off, 'month');
            startDate = target.startOf('month');
            endDate = target.endOf('month');
            periodLabel = target.format('MMMM YYYY');
        }

        const filtered = db.filter(t => {
            const tDate = dayjs(t.date);
            return tDate.isBetween(startDate, endDate, null, '[]');
        }).sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

        const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
        const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

        res.json({
            period: periodLabel,
            filter,
            offset: off,
            transactions: filtered,
            summary: {
                income,
                expense,
                balance: income - expense
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

const addTransaction = async (req, res) => {
    try {
        const tx = {
            id: uuidv4(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        db.push(tx);
        res.status(201).json(tx);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transaction' });
    }
};

const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const index = db.findIndex(t => t.id === id);
        if (index === -1) return res.status(404).json({ error: 'Not found' });

        db[index] = { ...db[index], ...req.body };
        res.json(db[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update' });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        db = db.filter(t => t.id !== id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
};

const exportTransactions = async (req, res) => {
    try {
        const { format } = req.query;
        if (db.length === 0) return res.status(404).json({ error: 'No data to export' });

        if (format === 'excel') {
            const buffer = exportToExcel(db);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
            return res.send(buffer);
        }
        if (format === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
            return exportToPDF(db, res);
        }
        res.status(400).json({ error: 'Invalid format' });
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
};

const clearAllData = async (req, res) => {
    try {
        db = [];
        res.json({ message: 'All data cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear data' });
    }
};

module.exports = {
    importTransactions,
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    exportTransactions,
    clearAllData
};
