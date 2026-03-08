import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useAuth } from './AuthContext';
import { LogOut, Wallet, TrendingUp, PieChart, Bell, ArrowDownRight } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const quickStats = [
    { icon: Wallet, label: 'Total Main Balance', value: '₹0.00', color: 'text-primary-light', bg: 'bg-primary/10' },
    { icon: TrendingUp, label: 'Total Income', value: '₹0.00', color: 'text-success', bg: 'bg-success/10', trend: '+0%' },
    { icon: ArrowDownRight, label: 'Total Expenses', value: '₹0.00', color: 'text-danger', bg: 'bg-danger/10', trend: '-0%' },
    { icon: Bell, label: 'Active Alerts', value: '0', color: 'text-warning', bg: 'bg-warning/10' },
  ];

  const glassStyle = "bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)]";

  // Animation variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

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
          className={`${glassStyle} sticky top-0 z-50 px-4 sm:px-6 py-4 rounded-b-2xl border-t-0 border-x-0 sm:mx-4 sm:mt-2 sm:rounded-2xl sm:border`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-text to-text-muted leading-tight">
                  Expense Tracker
                </h1>
                <p className="text-xs text-primary-light font-medium tracking-wide uppercase">
                  Personal Finance
                </p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-surface hover:bg-surface-light border border-surface-lighter flex items-center justify-center text-text-muted hover:text-text transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-surface animate-pulse" />
              </motion.button>
              
              <div className="h-8 w-[1px] bg-surface-lighter hidden sm:block" />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-lg shadow-danger/5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Greeting Card */}
            <motion.div
              variants={item}
              className={`${glassStyle} rounded-3xl p-8 sm:p-10 relative overflow-hidden group border-primary/40`}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-[100px] -z-10 group-hover:from-primary/30 transition-all duration-700" />
              
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-muted tracking-tight">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, 
                    <span className="text-primary-light ml-2">{user?.name?.split(' ')[0]} 👋</span>
                  </h2>
                  <p className="text-text-muted mt-3 text-lg font-medium leading-relaxed max-w-xl">
                    Here's your financial overview. You're doing great! Keep tracking to reach your goals faster.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="mt-8 flex gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <button className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5">
                    <TrendingUp className="w-5 h-5" /> Add Income
                  </button>
                  <button className="bg-surface-lighter hover:bg-surface-light border border-surface-lighter text-text px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5">
                    <ArrowDownRight className="w-5 h-5" /> Add Expense
                  </button>
                </motion.div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {quickStats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={item}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className={`${glassStyle} rounded-2xl p-6 transition-all duration-300 hover:border-primary/40 group hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden`}
                >
                  <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500`} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} border border-white/5 flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                    {stat.trend && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${stat.color === 'text-success' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-text-muted mb-1">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-black text-text tracking-tight">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Placeholder for future content */}
            <motion.div
              variants={item}
              className={`${glassStyle} rounded-3xl p-10 sm:p-16 text-center border-dashed border-2 border-surface-lighter/50 hover:border-primary/30 transition-colors`}
            >
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-6 shadow-inner"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              >
                <PieChart className="w-10 h-10 text-primary/60" />
              </motion.div>
              <h3 className="text-xl font-bold text-text mb-2">No Transactions Yet</h3>
              <p className="text-text-muted max-w-md mx-auto leading-relaxed">
                Your dashboard is looking a bit empty. Start tracking your expenses and income to see beautiful charts and insights appear here.
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
