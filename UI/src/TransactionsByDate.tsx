import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const TransactionsByDate = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();

    return (
        <div className="min-h-dvh bg-bg overflow-x-hidden relative font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <div className="relative z-10">
                <header className={`bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] sticky top-0 z-50 px-6 py-4 flex items-center justify-between`}>
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

                <main className="max-w-4xl mx-auto px-4 py-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-3xl p-6 sm:p-12 text-center">
                        <Calendar className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-text mb-3">Dummy Data for {date}</h2>
                        <p className="text-text-muted max-w-md mx-auto">
                            This is a placeholder page for viewing transactions on {date}. The actual data fetching will be implemented soon!
                        </p>
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default TransactionsByDate;
