const fs = require('fs');
const pdf = require('pdf-parse');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const { getCategoryInfo } = require('./categoryService');
const { detectPaymentMethod } = require('./paymentService');

const cleanAmount = (val) => {
    if (!val) return 0;
    const cleaned = String(val).replace(/[₹Rs,\s]/g, '');
    const num = parseFloat(cleaned) || 0;
    return Math.abs(num);
};

const parsePDF = async (filePath) => {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const rawText = data.text;

    const lines = rawText.split('\n');
    const importedTransactions = [];
    const createdCategories = new Set();
    let skippedRows = 0;

    const dateRegex = /^(\d{1,4}[-/]\d{1,2}[-/]\d{2,4})/;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || !dateRegex.test(trimmedLine)) return;

        const parts = trimmedLine.split(/\s{2,}/);

        if (parts.length < 3) {
            skippedRows++;
            return;
        }

        const dateStr = parts[0];

        // PDF parsing is often messy, let's try to detect amounts first
        let credit = 0;
        let debit = 0;

        // Find numeric values at the end of the line
        const numericParts = parts.map(p => ({ val: cleanAmount(p), original: p })).filter(p => !isNaN(p.val) && p.original.match(/\d/));

        if (parts.length >= 7) {
            credit = cleanAmount(parts[parts.length - 3]);
            debit = cleanAmount(parts[parts.length - 2]);
        } else if (numericParts.length >= 1) {
            // Fallback: guess if it's credit or debit based on position or assume debit (expense)
            debit = numericParts[numericParts.length - 1].val;
        }

        const type = credit > 0 ? 'income' : 'expense';
        const amount = credit > 0 ? credit : debit;

        if (amount <= 0) {
            skippedRows++;
            return;
        }

        // Categorization logic - check if Category/Subcategory seem to exist in parts[1] and parts[2]
        let category, subCategory, icon;
        const categoryInput = parts[1] || '';
        const subCategoryInput = parts[2] || '';
        const narration = parts.join(' ');

        if (categoryInput && categoryInput.length < 30 && !categoryInput.match(/\d/)) {
            // Likely a category column
            category = categoryInput.trim();
            subCategory = subCategoryInput.length < 30 ? subCategoryInput.trim() : 'Other';
            const match = getCategoryInfo(category, type);
            icon = match.icon;
        } else {
            // Auto-generate from narration
            const match = getCategoryInfo(narration, type);
            category = match.category;
            subCategory = match.subCategory;
            icon = match.icon;
        }

        const formattedDate = dayjs(dateStr, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'D-M-YYYY', 'MM/DD/YYYY']).format('YYYY-MM-DD');

        if (formattedDate === 'Invalid Date' || (credit === 0 && debit === 0)) {
            skippedRows++;
            return;
        }

        const paymentMethod = detectPaymentMethod(narration);

        createdCategories.add(JSON.stringify({ name: category, icon: icon, type: type }));

        importedTransactions.push({
            id: uuidv4(),
            date: formattedDate,
            category: category,
            categoryIcon: icon,
            subCategory: subCategory,
            description: subCategory || category,
            amount,
            type,
            credit,
            debit,
            paymentMethod,
            source: 'import',
            createdAt: new Date().toISOString()
        });
    });

    return {
        transactions: importedTransactions,
        categories: Array.from(createdCategories).map(c => JSON.parse(c)),
        summary: {
            totalRows: lines.length,
            importedRows: importedTransactions.length,
            skippedRows
        }
    };
};

module.exports = { parsePDF };
