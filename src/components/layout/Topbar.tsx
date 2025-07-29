import { Home, ChevronRight, User, LogOut, Settings, Bell, HelpCircle } from 'react-feather';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current section for breadcrumb
  const getCurrentSection = () => {
    const path = location.pathname.split('/')[1];
    switch(path) {
      case 'properties': return 'Propriétés';
      case 'clients': return 'Clients';
      case 'documents': return 'Documents';
      default: return 'Tableau de bord';
    }
  };

  return (
    <header className="glass-card p-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
      {/* Left side - Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <button 
          onClick={() => navigate('/')}
          className="text-text hover:text-accent transition-colors"
        >
          <Home size={16} />
        </button>
        <ChevronRight size={14} className="text-text/30" />
        <span className="font-medium text-text">{getCurrentSection()}</span>
      </div>

      {/* Right side - User menu with hover dropdown */}
      <div className="flex items-center space-x-4">
        {/* Notification bell */}
        <button className="p-2 text-text hover:text-accent transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full"></span>
        </button>

        {/* User profile dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-2 focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
              <User size={16} className="text-text" />
            </div>
          </button>

          {/* Dropdown menu */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 mt-2 w-56 origin-top-right bg-glass-card rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 
                      invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10 backdrop-blur-lg"
          >
            <div className="py-1">
              {/* User info */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-text">John Doe</p>
                <p className="text-xs text-text/60">Agent</p>
              </div>

              {/* Menu items */}
              <button 
                onClick={() => navigate('/settings')}
                className="flex w-full items-center px-4 py-2 text-sm text-left text-text hover:bg-white/5 transition-colors"
              >
                <Settings size={14} className="mr-3" />
                Paramètres
              </button>
              
              <button 
                onClick={() => navigate('/help')}
                className="flex w-full items-center px-4 py-2 text-sm text-left text-text hover:bg-white/5 transition-colors"
              >
                <HelpCircle size={14} className="mr-3" />
                Aide & Support
              </button>

              {/* Logout */}
              <button 
                onClick={() => {
                  console.log('Logging out...');
                  navigate('/auth/login');
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-left text-red-400 hover:bg-white/5 transition-colors border-t border-white/10 mt-1"
              >
                <LogOut size={14} className="mr-3" />
                Déconnexion
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}