const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');

/**
 * Enhanced Excel Export - Matches MoneyView Bank Statement Format
 */
const exportToExcel = (transactions) => {
    // Sort transactions by date ascending for correct balance calculation
    const sorted = [...transactions].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

    let runningBalance = 0;
    const dataRows = sorted.map(t => {
        const amount = t.amount || 0;
        if (t.type === 'income') runningBalance += amount;
        else runningBalance -= amount;

        return {
            'Date': dayjs(t.date).format('DD-MM-YYYY'),
            'Category': t.category || 'Other',
            'Subcategory': t.subCategory || '',
            'Narration': t.description || 'N/A',
            'Txn ID': t.id ? t.id.slice(-8).toUpperCase() : 'N/A',
            'Credit': t.type === 'income' ? `Rs. ${amount.toFixed(2)}` : '',
            'Debit': t.type === 'expense' ? `Rs. ${amount.toFixed(2)}` : '',
            'Closing balance': `Rs. ${runningBalance.toFixed(2)}`
        };
    });

    // Reversed for Excel view (Newest first)
    const finalRows = dataRows.reverse();

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(finalRows);

    // Styling: Column Widths
    const wscols = [
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 35 },
        { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Statement");
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Enhanced PDF Export - Professional Report
 */
const exportToPDF = (transactions, res) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Header
    doc.fillColor('#00bcd4').fontSize(24).text('Money Manager', { align: 'center' });
    doc.fillColor('#777').fontSize(10).text('Financial Transaction Report', { align: 'center' });
    doc.moveDown(2);

    // Table Setup
    const tableTop = 150;
    const colX = [40, 100, 180, 420, 500];
    const headers = ['Date', 'Category', 'Description', 'Type', 'Amount'];

    // Draw Headers
    doc.fillColor('#333').fontSize(11).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], tableTop));
    doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#ddd').lineWidth(1).stroke();

    let currentY = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    transactions.forEach((t, index) => {
        // Page Break Logic
        if (currentY > 750) {
            doc.addPage();
            currentY = 50;
        }

        // Zebra stripes
        if (index % 2 === 0) {
            doc.save().rect(40, currentY - 5, 510, 20).fill('#f9f9f9').restore();
        }

        doc.fillColor('#333');
        doc.text(dayjs(t.date).format('DD MMM YY'), colX[0], currentY);
        doc.text(t.category || 'Other', colX[1], currentY);
        doc.text(t.description || '', colX[2], currentY, { width: 230, truncate: true });

        const isExpense = t.type === 'expense';
        doc.fillColor(isExpense ? '#f44336' : '#4caf50');
        doc.text(t.type.toUpperCase(), colX[3], currentY);
        doc.text(`${isExpense ? '-' : '+'}₹${(t.amount || 0).toLocaleString()}`, colX[4], currentY, { align: 'right' });

        currentY += 20;
    });

    // Footer
    doc.pipe(res);
    doc.end();
};

module.exports = { exportToExcel, exportToPDF };
