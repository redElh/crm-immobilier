import { ChevronRight, User, LogOut, Settings, Bell, HelpCircle } from 'react-feather';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCurrentSection = () => {
    const path = location.pathname.split('/')[1];
    switch(path) {
      case 'properties': return 'Biens';
      case 'clients': return 'Clients';
      case 'documents': return 'Documents';
      case 'messages': return 'Messages';
      case 'settings': return 'Paramètres';
      default: return 'Tableau de bord';
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-card border-b border-border/50 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/')}
          className="text-text-secondary hover:text-text transition-colors"
        >
          <span className="font-medium">Dashboard</span>
        </button>
        {location.pathname.split('/').filter(Boolean).length > 1 && (
          <>
            <ChevronRight size={14} className="text-text-secondary/50" />
            <span className="text-text-secondary">{getCurrentSection()}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
          <Bell size={18} />
          <span className="absolute mt-[-8px] ml-[8px] w-2 h-2 bg-error rounded-full ring-2 ring-card" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center text-accent hover:bg-accent/20 transition-all"
          >
            <User size={16} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-50"
              >
                <div className="px-4 py-3 border-b border-border/40">
                  <p className="text-sm font-medium text-text">John Doe</p>
                  <p className="text-xs text-text-secondary">Agent</p>
                </div>

                <button
                  onClick={() => { navigate('/settings/profile'); setShowDropdown(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-background transition-colors"
                >
                  <Settings size={14} />
                  Paramètres
                </button>

                <button
                  onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-background transition-colors"
                >
                  <HelpCircle size={14} />
                  Aide & Support
                </button>

                <button
                  onClick={() => { navigate('/auth/login'); setShowDropdown(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-error hover:bg-error/5 transition-colors border-t border-border/40 mt-1"
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
