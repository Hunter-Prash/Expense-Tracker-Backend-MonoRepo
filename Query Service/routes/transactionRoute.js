import express from 'express';
import { 
    createTransaction, 
    getTransactions, 
    updateTransaction, 
    deleteTransaction, 
    getTransactionsByMonth,
    getSpendSummary
} from '../controllers/transactionController.js';
import authenticate from '../middlewares/jwtMiddleware.js';

const router = express.Router();

// Apply JWT middleware to all transaction routes securely
router.use(authenticate);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/month', getTransactionsByMonth);
router.get('/spend-summary', getSpendSummary);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
