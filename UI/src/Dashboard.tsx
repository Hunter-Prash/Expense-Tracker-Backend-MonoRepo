import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LogOut, Wallet, TrendingUp, PieChart, Bell, ArrowDownRight, Settings, X, Loader2, CheckCircle, Tag, FileText, IndianRupee, Trash2 } from 'lucide-react';
import { getISTDateString } from './utils/istDate';

const API_BASE = 'https://0ao6yod173.execute-api.ap-south-1.amazonaws.com/prod/query/api/v1';
const ALERT_API_BASE = 'https://0ao6yod173.execute-api.ap-south-1.amazonaws.com/prod/alert/api/v1';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getISTDateString());

  // Limit form state
  const [dailyLimit, setDailyLimit] = useState('');
  const [weeklyLimit, setWeeklyLimit] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [editingDaily, setEditingDaily] = useState(false);
  const [editingWeekly, setEditingWeekly] = useState(false);
  const [editingMonthly, setEditingMonthly] = useState(false);
  const [hasLimitBreach, setHasLimitBreach] = useState(false);
  const [breachMessage, setBreachMessage] = useState('');
  const [currentDailyLimit, setCurrentDailyLimit] = useState<number | null>(null);
  const [currentWeeklyLimit, setCurrentWeeklyLimit] = useState<number | null>(null);
  const [currentMonthlyLimit, setCurrentMonthlyLimit] = useState<number | null>(null);
  const [dailySpent, setDailySpent] = useState(0);
  const [weeklySpent, setWeeklySpent] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);

  const fetchLimitBreaches = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${ALERT_API_BASE}/limits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const limits = res.data?.limits || {};
      const dailyBreached = !!limits.daily_breached;
      const weeklyBreached = !!limits.weekly_breached;
      const monthlyBreached = !!limits.monthly_breached;
      setCurrentDailyLimit(limits.daily_limit ?? null);
      setCurrentWeeklyLimit(limits.weekly_limit ?? null);
      setCurrentMonthlyLimit(limits.monthly_limit ?? null);
      const breachedPeriods = [
        dailyBreached ? 'daily' : null,
        weeklyBreached ? 'weekly' : null,
        monthlyBreached ? 'monthly' : null
      ].filter(Boolean) as string[];

      if (breachedPeriods.length > 0) {
        setHasLimitBreach(true);
        setBreachMessage(`Limit breached for: ${breachedPeriods.join(', ')}`);
      } else {
        setHasLimitBreach(false);
        setBreachMessage('');
      }
    } catch (err) {
      console.error('Failed to fetch limit breach flags', err);
    }
  };

  const fetchSpendSummary = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/transactions/spend-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDailySpent(Number(res.data?.daily_spent || 0));
      setWeeklySpent(Number(res.data?.weekly_spent || 0));
      setMonthlySpent(Number(res.data?.monthly_spent || 0));
    } catch (err) {
      console.error('Failed to fetch spend summary', err);
    }
  };

  useEffect(() => {
    fetchLimitBreaches();
    fetchSpendSummary();
  }, [token]);

  const handleSetLimit = async (type: 'daily' | 'weekly' | 'monthly', value: string) => {
    if (!value || isNaN(Number(value)) || Number(value) < 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await axios.patch(
        `${ALERT_API_BASE}/limits/${type}`,
        { [`${type}_limit`]: parseFloat(value) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} limit set to ₹${value}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to set ${type} limit`);
    }
  };

  // Transaction form state
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [txnType, setTxnType] = useState<'income' | 'expense'>('expense');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnCategory, setTxnCategory] = useState('');
  const [txnDescription, setTxnDescription] = useState('');
  const [txnSubmitting, setTxnSubmitting] = useState(false);
  const [txnError, setTxnError] = useState('');
  const [txnSuccess, setTxnSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const openTransactionForm = (type: 'income' | 'expense') => {
    setTxnType(type);
    setTxnAmount('');
    setTxnCategory('');
    setTxnDescription('');
    setTxnError('');
    setTxnSuccess(false);
    setShowTransactionForm(true);
  };

  const handleTransactionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTxnError('');
    setTxnSubmitting(true);

    try {
      await axios.post(
        `${API_BASE}/transactions`,
        {
          amount: parseFloat(txnAmount),
          description: txnDescription || null,
          type: txnType,
          category_name: txnCategory,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTxnSuccess(true);
      toast.success('Transaction added successfully! 🎉');
      fetchSpendSummary();
      setTimeout(() => {
        fetchLimitBreaches();
      }, 10000);
      setTimeout(() => {
        setShowTransactionForm(false);
        setTxnSuccess(false);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to add transaction';
      setTxnError(msg);
      toast.error(msg);
    } finally {
      setTxnSubmitting(false);
    }
  };



  const glassStyle = "bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)]";

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const inputStyle = "w-full bg-surface/50 border border-surface-lighter rounded-xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-4 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base";
  const iconStyle = "absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-text-muted group-focus-within:text-primary transition-colors";

  return (
    <div className="min-h-dvh bg-bg overflow-x-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 font-sans">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={`${glassStyle} sticky top-0 z-50 px-3 sm:px-6 py-3 sm:py-4 rounded-b-2xl border-t-0 border-x-0 sm:mx-4 sm:mt-2 sm:rounded-2xl sm:border`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <span className="text-lg sm:text-xl">💰</span>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-text to-text-muted leading-none pt-0.5">
                  Expense Tracker
                </h1>
                <p className="text-[10px] sm:text-xs text-primary-light font-medium tracking-wide uppercase mt-0.5">
                  Personal Finance
                </p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-2 sm:gap-4 relative">
              <motion.button
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-surface hover:bg-surface-light border border-surface-lighter flex items-center justify-center text-text-muted hover:text-text transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-danger rounded-full border border-surface sm:border-2 animate-pulse" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, rotate: 45 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  showSettings 
                    ? 'bg-primary/20 text-primary border border-primary/40 shadow-inner'
                    : 'bg-surface hover:bg-surface-light border border-surface-lighter text-text-muted hover:text-text'
                }`}
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              
              <div className="h-6 w-[1px] bg-surface-lighter hidden sm:block mx-1" />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg shadow-danger/5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </motion.button>

              {/* Settings Dropdown */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`absolute top-12 sm:top-14 right-0 w-64 ${glassStyle} p-4 z-50 origin-top-right`}
                  >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-lighter">
                      <h3 className="font-bold text-text">Preferences</h3>
                      <button onClick={() => setShowSettings(false)} className="text-text-muted hover:text-danger transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {/* Daily Limit */}
                      <div className="p-3 rounded-xl bg-surface/50 border border-transparent hover:border-surface-lighter transition-all">
                        <button onClick={() => setEditingDaily(!editingDaily)} className="w-full flex flex-col items-start cursor-pointer group">
                          <span className="text-sm font-bold text-text group-hover:text-primary-light transition-colors">Set Daily Limit</span>
                          <span className="text-xs text-text-muted mt-1 text-left">Warn when daily spending exceeds limit</span>
                        </button>
                        <AnimatePresence>
                          {editingDaily && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-2 mt-3">
                                <input
                                  type="number"
                                  placeholder="e.g. 500"
                                  value={dailyLimit}
                                  onChange={(e) => setDailyLimit(e.target.value)}
                                  className="w-full bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                                <button
                                  onClick={() => { handleSetLimit('daily', dailyLimit); setEditingDaily(false); }}
                                  className="w-full bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                                >
                                  Set
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Weekly Limit */}
                      <div className="p-3 rounded-xl bg-surface/50 border border-transparent hover:border-surface-lighter transition-all">
                        <button onClick={() => setEditingWeekly(!editingWeekly)} className="w-full flex flex-col items-start cursor-pointer group">
                          <span className="text-sm font-bold text-text group-hover:text-primary-light transition-colors">Set Weekly Limit</span>
                          <span className="text-xs text-text-muted mt-1 text-left">Cap your weekly spending</span>
                        </button>
                        <AnimatePresence>
                          {editingWeekly && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-2 mt-3">
                                <input
                                  type="number"
                                  placeholder="e.g. 3000"
                                  value={weeklyLimit}
                                  onChange={(e) => setWeeklyLimit(e.target.value)}
                                  className="w-full bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                                <button
                                  onClick={() => { handleSetLimit('weekly', weeklyLimit); setEditingWeekly(false); }}
                                  className="w-full bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                                >
                                  Set
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Monthly Limit */}
                      <div className="p-3 rounded-xl bg-surface/50 border border-transparent hover:border-surface-lighter transition-all">
                        <button onClick={() => setEditingMonthly(!editingMonthly)} className="w-full flex flex-col items-start cursor-pointer group">
                          <span className="text-sm font-bold text-text group-hover:text-primary-light transition-colors">Set Monthly Limit</span>
                          <span className="text-xs text-text-muted mt-1 text-left">Track against your monthly budget</span>
                        </button>
                        <AnimatePresence>
                          {editingMonthly && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-2 mt-3">
                                <input
                                  type="number"
                                  placeholder="e.g. 15000"
                                  value={monthlyLimit}
                                  onChange={(e) => setMonthlyLimit(e.target.value)}
                                  className="w-full bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                                <button
                                  onClick={() => { handleSetLimit('monthly', monthlyLimit); setEditingMonthly(false); }}
                                  className="w-full bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                                >
                                  Set
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          <div className="rounded-2xl border border-primary/35 bg-primary/10 text-text px-4 sm:px-6 py-3 sm:py-4 font-bold text-sm sm:text-base shadow-lg">
            Current Limits: Daily - {currentDailyLimit ?? 'Not set'} | Weekly - {currentWeeklyLimit ?? 'Not set'} | Monthly - {currentMonthlyLimit ?? 'Not set'}
          </div>
          {hasLimitBreach && (
            <div className="rounded-2xl border border-danger/35 bg-danger/12 text-danger px-4 sm:px-6 py-3 sm:py-4 font-bold text-sm sm:text-base shadow-lg">
              Alert: {breachMessage}
            </div>
          )}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 sm:space-y-8"
          >
            {/* Greeting Card */}
            <motion.div
              variants={item}
              className={`${glassStyle} rounded-3xl p-6 sm:p-10 relative overflow-hidden group border-primary/40`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-[60px] sm:rounded-bl-[100px] -z-10 group-hover:from-primary/30 transition-all duration-700" />
              
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-muted tracking-tight">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, 
                    <span className="text-primary-light ml-1.5 sm:ml-2 block sm:inline">{user?.name?.split(' ')[0]} 👋</span>
                  </h2>
                  <p className="text-text-muted mt-3 text-sm sm:text-lg font-medium leading-relaxed max-w-xl">
                    Here's your financial overview. You're doing great! Keep tracking to reach your goals faster.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-surface/70 border border-surface-lighter px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-text-muted font-bold">Today Spent</p>
                      <p className="text-lg font-extrabold text-danger mt-1">₹{dailySpent.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-surface/70 border border-surface-lighter px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-text-muted font-bold">Week Spent</p>
                      <p className="text-lg font-extrabold text-danger mt-1">₹{weeklySpent.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-surface/70 border border-surface-lighter px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-text-muted font-bold">Month Spent</p>
                      <p className="text-lg font-extrabold text-danger mt-1">₹{monthlySpent.toFixed(2)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => openTransactionForm('expense')}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-light text-white px-5 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Wallet className="w-5 h-5 flex-shrink-0" /> Add Transaction
                  </button>
                </motion.div>
              </div>
            </motion.div>



            {/* Link to Transactions Page */}
            <motion.div
              variants={item}
              className={`${glassStyle} rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                 <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">View Your Transactions</h3>
              <p className="text-text-muted mb-8 max-w-md">
                Manage, update, and track all your daily income and expenses in one dedicated place.
              </p>
              <div className="flex flex-col gap-6 w-full max-w-md">
                <button
                  onClick={() => navigate('/transactions')}
                  className="w-full bg-surface hover:bg-surface-light text-primary border border-primary/30 hover:border-primary px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(var(--color-primary),0.1)] hover:shadow-[0_0_30px_rgba(var(--color-primary),0.2)] cursor-pointer"
                >
                  <span>See Today's Transactions</span>
                  <ArrowDownRight className="w-5 h-5 -rotate-90" />
                </button>

                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 h-[1px] bg-surface-lighter rounded-full"></div>
                  <span className="text-xs text-text-muted font-bold tracking-wider">OR PAST RECORD</span>
                  <div className="flex-1 h-[1px] bg-surface-lighter rounded-full"></div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-1/2 bg-surface/50 border border-surface-lighter rounded-xl py-3.5 px-4 text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base [color-scheme:dark]"
                  />
                  <button
                    onClick={() => navigate(`/transactions/${selectedDate}`)}
                    className="w-full sm:w-1/2 bg-surface hover:bg-surface-light text-primary border border-primary/30 hover:border-primary px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(var(--color-primary),0.1)] hover:shadow-[0_0_30px_rgba(var(--color-primary),0.2)] cursor-pointer whitespace-nowrap"
                  >
                    <span>See Transactions</span>
                    <ArrowDownRight className="w-5 h-5 -rotate-90" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* ── Add Transaction Modal ── */}
      <AnimatePresence>
        {showTransactionForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !txnSubmitting && setShowTransactionForm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
              <div className={`w-full sm:max-w-md ${glassStyle} rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txnType === 'income' ? 'bg-success/20' : 'bg-danger/20'}`}>
                      {txnType === 'income' 
                        ? <TrendingUp className="w-5 h-5 text-success" /> 
                        : <ArrowDownRight className="w-5 h-5 text-danger" />
                      }
                    </div>
                    <h2 className="text-xl font-bold text-text">
                      Add {txnType === 'income' ? 'Income' : 'Expense'}
                    </h2>
                  </div>
                  <button 
                    onClick={() => !txnSubmitting && setShowTransactionForm(false)}
                    className="text-text-muted hover:text-danger transition-colors cursor-pointer p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Type Toggle */}
                <div className="flex bg-surface-lighter/50 rounded-xl p-1.5 mb-6 border border-surface-lighter">
                  <button
                    type="button"
                    onClick={() => setTxnType('income')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer relative ${
                      txnType === 'income' ? 'text-white shadow-lg shadow-success/30' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {txnType === 'income' && (
                      <motion.div layoutId="txnTypeTab" className="absolute inset-0 bg-success rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnType('expense')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer relative ${
                      txnType === 'expense' ? 'text-white shadow-lg shadow-danger/30' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {txnType === 'expense' && (
                      <motion.div layoutId="txnTypeTab" className="absolute inset-0 bg-danger rounded-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                    Expense
                  </button>
                </div>

                {/* Success State */}
                <AnimatePresence>
                  {txnSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8"
                    >
                      <CheckCircle className="w-16 h-16 text-success mb-4" />
                      <p className="text-lg font-bold text-text">Transaction Added!</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {txnError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 overflow-hidden"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                      <p className="text-danger text-sm font-medium">{txnError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                {!txnSuccess && (
                  <form onSubmit={handleTransactionSubmit} className="space-y-4">
                    {/* Amount */}
                    <div className="relative group">
                      <IndianRupee className={iconStyle} />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={txnAmount}
                        onChange={(e) => setTxnAmount(e.target.value)}
                        className={inputStyle}
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="relative group">
                      <Tag className={iconStyle} />
                      <input
                        type="text"
                        placeholder="Category (e.g. Shopping, Salary)"
                        value={txnCategory}
                        onChange={(e) => setTxnCategory(e.target.value)}
                        className={inputStyle}
                        required
                      />
                    </div>

                    {/* Date Removed: Auto-generated on backend */}

                    {/* Description */}
                    <div className="relative group">
                      <FileText className={`${iconStyle} top-4 sm:top-5`} />
                      <textarea
                        placeholder="Description (optional)"
                        value={txnDescription}
                        onChange={(e) => setTxnDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-surface/50 border border-surface-lighter rounded-xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-4 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm sm:text-base"
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={txnSubmitting}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg mt-2 text-white ${
                        txnType === 'income' 
                          ? 'bg-success hover:bg-success/90 shadow-success/25' 
                          : 'bg-danger hover:bg-danger/90 shadow-danger/25'
                      }`}
                    >
                      {txnSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {txnType === 'income' ? 'Add Income' : 'Add Expense'}
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
