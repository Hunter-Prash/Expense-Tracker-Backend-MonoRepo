import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';

const WorkTracker = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-bg overflow-x-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          className="bg-surface/85 backdrop-blur-2xl border border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-3xl p-6 sm:p-10"
        >
          <div className="flex items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-primary-light">
                <BriefcaseBusiness className="w-3.5 h-3.5" />
                Work Tracker
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-text">Workspace Coming Soon</h1>
              <p className="mt-3 text-sm sm:text-base text-text-muted max-w-2xl">
                This is a placeholder page for the future work tracker module. We can plug task tracking, timers, notes, or team workflows in here next.
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="shrink-0 flex items-center gap-2 rounded-xl border border-surface-lighter bg-surface/70 px-4 py-2 text-sm font-bold text-text-muted hover:text-text hover:bg-surface-light transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              'Task board placeholder',
              'Project timeline placeholder',
              'Notes and status placeholder',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-surface-lighter bg-surface/50 p-5 text-sm font-medium text-text-muted"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkTracker;
