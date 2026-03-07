const detectPaymentMethod = (narration = '') => {
    const text = narration.toUpperCase();

    // UPI Rules
    if (text.includes('UPI') ||
        text.includes('UPI/') ||
        text.includes('@OKAXIS') ||
        text.includes('@OKSBI') ||
        text.includes('@OKICICI') ||
        text.includes('@IBL')) {
        return 'UPI';
    }

    // Cash Rules
    if (text.includes('ATM') ||
        text.includes('ATM WDL') ||
        text.includes('CASH WITHDRAWAL')) {
        return 'CASH';
    }

    // Account / Transfer Rules
    if (text.includes('NEFT') ||
        text.includes('IMPS') ||
        text.includes('BANK TRANSFER') ||
        text.includes('ACCOUNT TRANSFER')) {
        return 'ACC';
    }

    // Default
    return 'ACC';
};

module.exports = { detectPaymentMethod };
