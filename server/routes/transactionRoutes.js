const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const transactionController = require('../controllers/transactionController');

// Import Transactions
router.post('/import', upload.single('file'), transactionController.importTransactions);

// GET filtered transactions
router.get('/', transactionController.getTransactions);

// Add manual transaction
router.post('/', transactionController.addTransaction);

// Update transaction
router.patch('/:id', transactionController.updateTransaction);

// Clear All
router.delete('/clear', transactionController.clearAllData);

// Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

// Export
router.get('/export', transactionController.exportTransactions);

module.exports = router;