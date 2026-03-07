import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { getCategoryInfo } from './categoryService';
import { detectPaymentMethod } from './paymentService';

const HEADERS = {
    DATE: ['date', 'txn date', 'transaction date', 'value date', 'posting date'],
    DESCRIPTION: ['description', 'narration', 'particulars', 'narration/txn id', 'transaction remarks', 'remarks', 'details'],
    CATEGORY: ['category', 'type', 'transaction type'],
    SUBCATEGORY: ['subcategory', 'sub category', 'description', 'narration'],
    CREDIT: ['credit', 'deposit', 'income', 'amount in', 'credit amount', 'cr amount', 'cr'],
    DEBIT: ['debit', 'withdrawal', 'expense', 'amount out', 'debit amount', 'dr amount', 'dr'],
    AMOUNT: ['amount', 'txn amount', 'transaction amount']
};

const cleanAmount = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val)
        .replace(/[₹$€£¥]/g, '')
        .replace(/Rs\.?\s*/gi, '')
        .replace(/INR\s*/gi, '')
        .replace(/,/g, '')
        .replace(/\s+/g, '')
        .trim();
    if (!str || str === '-' || str === 'N/A' || str === 'NA') return 0;
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.abs(num);
};

export const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const importedTransactions = [];
    const createdCategories = new Set();
    let skippedRows = 0;

    rows.forEach(row => {
        const lowerRow = Object.keys(row).reduce((acc, key) => {
            acc[key.toLowerCase().trim()] = row[key];
            return acc;
        }, {});

        let foundDate = null;
        let foundDescription = '';
        let foundCategoryInput = '';
        let foundSubCategoryInput = '';
        let foundCredit = 0;
        let foundDebit = 0;
        let foundAmount = 0;

        for (const [key, value] of Object.entries(lowerRow)) {
            const k = key.trim();
            if (HEADERS.DATE.includes(k)) foundDate = value;
            else if (HEADERS.DESCRIPTION.includes(k)) foundDescription = String(value || '');
            else if (HEADERS.CATEGORY.includes(k)) foundCategoryInput = String(value || '');
            else if (HEADERS.SUBCATEGORY.includes(k)) {
                if (!foundSubCategoryInput || !HEADERS.DESCRIPTION.includes(k)) {
                    foundSubCategoryInput = String(value || '');
                }
            }
            else if (HEADERS.CREDIT.includes(k)) foundCredit = cleanAmount(value);
            else if (HEADERS.DEBIT.includes(k)) foundDebit = cleanAmount(value);
            else if (HEADERS.AMOUNT.includes(k)) foundAmount = cleanAmount(value);
        }

        if (!foundDate) { skippedRows++; return; }

        if (foundCredit === 0 && foundDebit === 0 && foundAmount > 0) {
            const narLower = (foundDescription || foundCategoryInput).toLowerCase();
            const isIncome = ['credit', 'credited', 'received', 'salary', 'refund', 'cashback'].some(w => narLower.includes(w));
            foundCredit = isIncome ? foundAmount : 0;
            foundDebit = isIncome ? 0 : foundAmount;
        }

        if (foundCredit > 0 && foundDebit > 0) { foundCredit = 0; }
        if (foundCredit === 0 && foundDebit === 0) { skippedRows++; return; }

        const type = foundCredit > 0 ? 'income' : 'expense';
        const amount = foundCredit > 0 ? foundCredit : foundDebit;

        let category, subCategory, icon;

        if (foundCategoryInput && foundCategoryInput.trim()) {
            category = foundCategoryInput.trim();
            subCategory = foundSubCategoryInput || 'Other';
            const match = getCategoryInfo(category, type);
            icon = match.icon;
        } else {
            const match = getCategoryInfo(foundDescription || foundSubCategoryInput || '', type);
            category = match.category;
            subCategory = match.subCategory;
            icon = match.icon;
        }

        let formattedDate;
        if (typeof foundDate === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            const jsDate = new Date(excelEpoch.getTime() + (foundDate - 2) * 86400000);
            formattedDate = dayjs(jsDate).format('YYYY-MM-DD');
        } else {
            formattedDate = dayjs(String(foundDate).trim(), ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'D-M-YYYY', 'D/M/YYYY', 'MM/DD/YYYY']).format('YYYY-MM-DD');
        }

        if (!formattedDate || formattedDate === 'Invalid Date') { skippedRows++; return; }

        const paymentMethod = detectPaymentMethod(foundDescription || foundSubCategoryInput || foundCategoryInput);

        createdCategories.add(JSON.stringify({ name: category, icon: icon, type: type }));

        importedTransactions.push({
            id: uuidv4(),
            date: formattedDate,
            category: category,
            categoryIcon: icon,
            subCategory: subCategory,
            description: foundDescription || subCategory,
            amount,
            type,
            credit: foundCredit,
            debit: foundDebit,
            paymentMethod,
            source: 'import',
            createdAt: new Date().toISOString()
        });
    });

    return {
        transactions: importedTransactions,
        categories: Array.from(createdCategories).map(c => JSON.parse(c)),
        summary: {
            totalRows: rows.length,
            importedRows: importedTransactions.length,
            skippedRows
        }
    };
};
