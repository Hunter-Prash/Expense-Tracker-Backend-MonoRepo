import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, TrendingUp, ArrowDownRight, Loader2, PieChart, Trash2, Edit2, X } from 'lucide-react';

const API_BASE = 'https://0ao6yod173.execute-api.ap-south-1.amazonaws.com/prod/query/api/v1';
const ALERT_API_BASE = 'https://0ao6yod173.execute-api.ap-south-1.amazonaws.com/prod/alert/api/v1';

const TransactionsByDate = () => {
    const { date } = useParams<{ date: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTxns, setLoadingTxns] = useState(true);
    const [hasLimitBreach, setHasLimitBreach] = useState(false);
    const [breachMessage, setBreachMessage] = useState('');

    const [updatingTxnId, setUpdatingTxnId] = useState<string | null>(null);
    const [updateForm, setUpdateForm] = useState({
        amount: '',
        description: '',
        category_name: '',
        type: 'expense' as 'income' | 'expense'
    });
    const [submittingUpdate, setSubmittingUpdate] = useState(false);

    const fetchTransactions = async () => {
        try {
            setLoadingTxns(true);
            const res = await axios.get(`${API_BASE}/transactions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(res.data);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
            toast.error('Could not load your transactions');
        } finally {
            setLoadingTxns(false);
        }
    };

    const fetchLimitBreaches = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${ALERT_API_BASE}/limits`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const limits = res.data?.limits || {};
            const breachedPeriods = [
                limits.daily_breached ? 'daily' : null,
                limits.weekly_breached ? 'weekly' : null,
                limits.monthly_breached ? 'monthly' : null
            ].filter(Boolean) as string[];

            if (breachedPeriods.length > 0) {
                setHasLimitBreach(true);
                setBreachMessage(`Limit breached for: ${breachedPeriods.join(', ')}`);
            } else {
                setHasLimitBreach(false);
                setBreachMessage('');
            }
        } catch (error) {
            console.error('Failed to fetch limit breach flags', error);
        }
    };

    useEffect(() => {
        fetchTransactions();
        fetchLimitBreaches();
    }, [token]);

    const handleDeleteTransaction = async (id: string) => {
        try {
            await axios.delete(`${API_BASE}/transactions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Transaction deleted');
            fetchTransactions();
            setTimeout(() => {
                fetchLimitBreaches();
            }, 10000);
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete the transaction');
        }
    };

    const handleOpenUpdate = (txn: any) => {
        setUpdatingTxnId(txn.id);
        setUpdateForm({
            amount: String(txn.amount),
            description: txn.description || '',
            category_name: txn.category_name || '',
            type: txn.type
        });
    };

    const handleUpdateSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!updatingTxnId) return;

        setSubmittingUpdate(true);
        try {
            await axios.put(
                `${API_BASE}/transactions/${updatingTxnId}`,
                {
                    amount: parseFloat(updateForm.amount),
                    description: updateForm.description || null,
                    type: updateForm.type,
                    category_name: updateForm.category_name,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.success('Transaction updated successfully');
            setUpdatingTxnId(null);
            fetchTransactions();
            setTimeout(() => {
                fetchLimitBreaches();
            }, 10000);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update transaction');
        } finally {
            setSubmittingUpdate(false);
        }
    };

    const selectedDate = date || '';
    const selectedDateTransactions = transactions.filter(
        (t) => t.transaction_date && t.transaction_date.startsWith(selectedDate)
    );

    const glassStyle = 'bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)]';

    const container: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    const inputStyle = 'w-full bg-surface/50 border border-surface-lighter rounded-xl py-3 px-4 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

    return (
        <div className="min-h-dvh bg-bg overflow-x-hidden relative font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <div className="relative z-10">
                <header className={`${glassStyle} sticky top-0 z-50 px-6 py-4 flex items-center justify-between`}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold">Back to Dashboard</span>
                    </button>
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-text to-text-muted">
                        Transactions for {selectedDate}
                    </h1>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-8">
                    {hasLimitBreach && (
                        <div className="rounded-2xl border border-danger/35 bg-danger/12 text-danger px-4 py-3 font-bold text-sm sm:text-base shadow-lg mb-4">
                            Alert: {breachMessage}
                        </div>
                    )}
                    <motion.div variants={container} initial="hidden" animate="show" className={`${glassStyle} rounded-3xl p-6 sm:p-8`}>
                        {loadingTxns ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                        ) : selectedDateTransactions.length === 0 ? (
                            <motion.div variants={item} className="rounded-2xl p-12 text-center border-dashed border-2 border-surface-lighter/50 mx-auto">
                                <PieChart className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                                <h4 className="text-xl font-bold text-text mb-2">No Transactions on {selectedDate}</h4>
                                <p className="text-text-muted max-w-md mx-auto">
                                    No income or expense records were found for this date.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                {selectedDateTransactions.map((txn, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={txn.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-surface hover:bg-surface-light border border-surface-lighter transition-colors group gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${txn.type === 'income' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                {txn.type === 'income' ? <TrendingUp className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text text-lg">{txn.category_name}</p>
                                                {txn.description && <p className="text-sm text-text-muted mt-0.5">{txn.description}</p>}
                                                <p className="text-xs text-text-muted mt-1 opacity-60">{new Date(txn.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-surface-lighter pt-4 sm:pt-0">
                                            <p className={`font-bold text-2xl ${txn.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                                {txn.type === 'income' ? '+' : '-'}Rs {Number(txn.amount).toFixed(2)}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenUpdate(txn)}
                                                    className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                                                    title="Edit Transaction"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTransaction(txn.id)}
                                                    className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors cursor-pointer"
                                                    title="Delete Transaction"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </main>
            </div>

            <AnimatePresence>
                {updatingTxnId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => !submittingUpdate && setUpdatingTxnId(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        >
                            <div className={`w-full max-w-md ${glassStyle} rounded-2xl p-8`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-text flex items-center gap-2">
                                        <Edit2 className="w-5 h-5 text-primary" /> Edit Transaction
                                    </h2>
                                    <button onClick={() => !submittingUpdate && setUpdatingTxnId(null)} className="text-text-muted hover:text-danger cursor-pointer p-1">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdateSubmit} className="space-y-5">
                                    <div className="flex bg-surface-lighter/50 rounded-xl p-1.5 border border-surface-lighter">
                                        <button
                                            type="button"
                                            onClick={() => setUpdateForm({ ...updateForm, type: 'income' })}
                                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${updateForm.type === 'income' ? 'bg-success text-white' : 'text-text-muted hover:text-text'}`}
                                        >
                                            Income
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUpdateForm({ ...updateForm, type: 'expense' })}
                                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${updateForm.type === 'expense' ? 'bg-danger text-white' : 'text-text-muted hover:text-text'}`}
                                        >
                                            Expense
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-text-muted mb-2">Category Name</label>
                                        <input
                                            required
                                            placeholder="e.g. Groceries"
                                            value={updateForm.category_name}
                                            onChange={(e) => setUpdateForm({ ...updateForm, category_name: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-text-muted mb-2">Amount (Rs)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            value={updateForm.amount}
                                            onChange={(e) => setUpdateForm({ ...updateForm, amount: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-text-muted mb-2">Description <span className="text-xs font-normal opacity-50">(Optional)</span></label>
                                        <input
                                            placeholder="Add details..."
                                            value={updateForm.description}
                                            onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submittingUpdate}
                                        className="w-full bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer flex justify-center items-center h-[52px] mt-2"
                                    >
                                        {submittingUpdate ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransactionsByDate;
