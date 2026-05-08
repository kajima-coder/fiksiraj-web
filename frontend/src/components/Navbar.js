import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Calendar, Clock, Briefcase, Home, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/prijava');
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) => `
    p-2.5 sm:px-5 sm:py-3 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center gap-2
    ${isActive(path) 
      ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/20' 
      : 'text-slate-500 hover:text-primary hover:bg-primary/5'
    }
  `;

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 py-2 sm:py-4">
          <Link to="/dashboard" className="flex items-center space-x-2 group">
            <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight group-hover:scale-105 transition-transform" style={{fontFamily: "'Sora', sans-serif"}}>Fiksiraj</span>
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/dashboard"
              className={navLinkClass('/dashboard')}
              data-testid="nav-dashboard"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Početna</span>
            </Link>
            <Link
              to="/usluge"
              className={navLinkClass('/usluge')}
              data-testid="nav-services"
            >
              <Briefcase className="w-5 h-5" />
              <span className="hidden sm:inline">Usluge</span>
            </Link>
            <Link
              to="/radno-vrijeme"
              className={navLinkClass('/radno-vrijeme')}
              data-testid="nav-hours"
            >
              <Clock className="w-5 h-5" />
              <span className="hidden sm:inline">Vrijeme</span>
            </Link>
            <Link
              to="/rezervacije"
              className={navLinkClass('/rezervacije')}
              data-testid="nav-bookings"
            >
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline">Rezervacije</span>
            </Link>
            <Link
              to="/postavke"
              className={navLinkClass('/postavke')}
              data-testid="nav-settings"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Postavke</span>
            </Link>
            
            <div className="h-8 w-px bg-slate-200 mx-2 sm:mx-3 hidden sm:block"></div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-black text-slate-600">{user?.name?.charAt(0)}</span>
                </div>
                <span className="text-sm font-bold text-slate-600">{user?.name}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl p-2.5 transition-all duration-300"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
