import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const glassStyle = "bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl";

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden bg-bg">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px] animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite_1s]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-primary-dark/10 rounded-full blur-[80px] animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite_2s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.1, stiffness: 200, damping: 20 }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4 shadow-lg shadow-primary/20 cursor-pointer"
          >
            <span className="text-3xl">💰</span>
          </motion.div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text to-primary-light">
            Expense Tracker
          </h1>
          <p className="text-text-muted mt-2 font-medium">Track your money, effortlessly</p>
        </motion.div>

        {/* Card */}
        <div className={`${glassStyle} p-6 sm:p-8 transition-all duration-300 hover:shadow-primary/10`}>
          {/* Tab Toggle */}
          <div className="flex bg-surface-lighter/50 rounded-xl p-1.5 mb-8 backdrop-blur-sm border border-surface-lighter">
            <button
              onClick={() => !isLogin && toggleMode()}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer relative ${
                isLogin
                  ? 'text-white shadow-lg shadow-primary/30'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {isLogin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              Login
            </button>
            <button
              onClick={() => isLogin && toggleMode()}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer relative ${
                !isLogin
                  ? 'text-white shadow-lg shadow-primary/30'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {!isLogin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              Sign Up
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 overflow-hidden"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                <p className="text-danger text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, x: -20 }}
                  animate={{ opacity: 1, height: 'auto', x: 0 }}
                  exit={{ opacity: 0, height: 0, x: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="overflow-hidden"
                >
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface/50 border border-surface-lighter rounded-xl py-3.5 pl-12 pr-4 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface/50 border border-surface-lighter rounded-xl py-3.5 pl-12 pr-4 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface/50 border border-surface-lighter rounded-xl py-3.5 pl-12 pr-12 text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer p-1 rounded-md"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/25 hover:shadow-primary/40 mt-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer text */}
          <p className="text-center text-text-muted text-sm mt-8">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={toggleMode}
              className="text-primary hover:text-primary-light font-bold transition-colors cursor-pointer hover:underline underline-offset-4"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

