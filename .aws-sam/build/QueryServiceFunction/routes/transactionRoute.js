import express from 'express';
import { 
    createTransaction, 
    getTransactions, 
    updateTransaction, 
    deleteTransaction 
} from '../controllers/transactionController.js';
import authenticate from '../middlewares/jwtMiddleware.js';

const router = express.Router();

// Apply JWT middleware to all transaction routes securely
router.use(authenticate);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
