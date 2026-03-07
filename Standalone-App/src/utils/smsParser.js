export class SMSParser {
    static parse(message) {
        if (!message) return null;
        const text = message.toLowerCase();

        // 1. Identify Valid Transaction SMS
        // Keywords to include
        const keywords = ['debited', 'credited', 'spent', 'received', 'txn', 'transaction', 'upi'];
        const hasKeyword = keywords.some(k => text.includes(k));

        // Keywords to exclude
        const ignoreWords = ['otp', 'offer', 'cashback', 'win', 'reward', 'sale'];
        const hasIgnoreWord = ignoreWords.some(k => text.includes(k));

        if (!hasKeyword || hasIgnoreWord) {
            return null;
        }

        // 2. Determine Transaction Type
        let type = 'expense'; // Default
        if (text.includes('credited') || text.includes('received')) {
            type = 'income';
        } else if (text.includes('debited') || text.includes('spent') || text.includes('paid')) {
            type = 'expense';
        }

        // 3. Extract Amount
        // Support: ₹500, Rs. 1,250.50, INR 3000
        const amountRegex = /(?:₹|rs\.?|inr)\s?([\d,]+(\.\d{1,2})?)/i;
        const amountMatch = message.match(amountRegex);
        if (!amountMatch) return null;

        const amountStr = amountMatch[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return null;

        // 4. Detect Payment Mode
        let mode = 'cash'; // Default fallback
        if (text.includes('upi')) mode = 'upi';
        else if (text.includes('card') || text.includes('debit card') || text.includes('credit card')) mode = 'card';
        else if (text.includes('netbanking') || text.includes('net banking')) mode = 'acc';

        // 5. Extract Reference ID (Optional)
        // Patterns: Ref no, UPI Ref, Txn ID, Transaction ID
        const refRegex = /(?:ref\s?no|upi\s?ref|txn\s?id|transaction\s?id)[\s:\-]*([a-zA-Z0-9]+)/i;
        const refMatch = message.match(refRegex);
        const referenceId = refMatch ? refMatch[1] : null;

        // 6. Date Handling
        // Try to find a date in the message, else default to today (caller should override with SMS timestamp if available)
        // Simple date regex for DD-MM-YYYY or DD/MM/YYYY or DD-Mon
        // This is a basic attempt, reliability varies
        let date = new Date().toISOString();
        // Note: Real date parsing from varied text is complex without a library like chrono-node.
        // We will default to 'now' and let the modal/user adjust if needed.

        // Generate a description (simple)
        const description = referenceId ? `Txn: ${referenceId}` : `SMS Transaction`;

        return {
            type,
            amount,
            date,
            paymentMethod: mode,
            referenceId, // Can be null
            description,
            originalText: message
        };
    }

    /**
     * Generates a unique hash for duplicate detection
     * Hash = amount + date(YYYY-MM-DD) + referenceId
     */
    static generateHash(transaction) {
        if (!transaction) return null;

        const dateStr = transaction.date.split('T')[0];
        const refPart = transaction.referenceId || 'no_ref';
        const amountPart = transaction.amount.toString();

        // Simple string concatenation as hash
        return `${amountPart}_${dateStr}_${refPart}`;
    }
}
