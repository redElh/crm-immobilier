import { Search, Bell, User } from 'react-feather'

export default function Topbar() {
  return (
    <header className="glass-card p-4 flex items-center justify-between">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/50" size={18} />
        <input
          type="text"
          placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-accent text-text"
        />
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-accent/10 transition-colors relative">
          <Bell className="text-text" size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-premium rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center">
            <User className="text-text" size={16} />
          </div>
          <span className="text-sm text-text">Agent</span>
        </div>
      </div>
    </header>
  )
}