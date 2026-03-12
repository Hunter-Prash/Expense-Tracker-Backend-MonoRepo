import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';

const TransactionsByDate = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [txns, setTxns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getAllTxns = async () => {
            try {
                const results = await axios.get(
                    `https://0ao6yod173.execute-api.ap-south-1.amazonaws.com/prod/query/api/v1/transactions`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setTxns(results.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        getAllTxns();
    }, [token]);

    // Filter transactions for selected date
    const todaysTxns = txns.filter(
        (t) => t.transaction_date.slice(0, 10) === date
    );

    return (
        <div className="min-h-dvh bg-bg overflow-x-hidden relative font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <div className="relative z-10">

                {/* HEADER */}
                <header className="bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold">Back to Dashboard</span>
                    </button>

                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-text to-text-muted">
                        Transactions for {date}
                    </h1>
                </header>

                {/* MAIN */}
                <main className="max-w-4xl mx-auto px-4 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-3xl p-6 sm:p-12"
                    >

                        {/* Loading */}
                        {loading && (
                            <div className="text-center text-text-muted">
                                Loading transactions...
                            </div>
                        )}

                        {/* No transactions */}
                        {!loading && todaysTxns.length === 0 && (
                            <div className="text-center text-text-muted">
                                No transactions for this date
                            </div>
                        )}

                        {/* Transactions */}
                        {!loading &&
                            todaysTxns.map((txn) => (
                                <div
                                    key={txn.id}
                                    className="flex justify-between items-center bg-bg/40 p-4 rounded-xl mb-4"
                                >

                                    <div className="flex flex-col">
                                        <span className="font-semibold text-text">
                                            {txn.category_name}
                                        </span>

                                        <span className="text-sm text-text-muted">
                                            {txn.description}
                                        </span>
                                    </div>

                                    <div
                                        className={`font-bold text-lg ${
                                            txn.type === "expense"
                                                ? "text-red-400"
                                                : "text-green-400"
                                        }`}
                                    >
                                        {txn.type === "expense" ? "-" : "+"}
                                        ₹{txn.amount}
                                    </div>

                                </div>
                            ))}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default TransactionsByDate;