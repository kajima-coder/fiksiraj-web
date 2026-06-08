import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Calendar, Clock, Briefcase, Home, Settings } from 'lucide-react';

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
    px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
    ${isActive(path) 
      ? 'bg-black text-white' 
      : 'text-gray-500 hover:text-black hover:bg-gray-100'
    }
  `;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link to="/dashboard" className="flex items-center">
            <span className="text-2xl sm:text-3xl font-bold text-black tracking-tight" style={{fontFamily: "'Sora', sans-serif"}}>Fiksiraj</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={navLinkClass('/dashboard')}
              data-testid="nav-dashboard"
            >
              <Home className="w-4 h-4" />
              <span>Početna</span>
            </Link>
            <Link
              to="/usluge"
              className={navLinkClass('/usluge')}
              data-testid="nav-services"
            >
              <Briefcase className="w-4 h-4" />
              <span>Usluge</span>
            </Link>
            <Link
              to="/radno-vrijeme"
              className={navLinkClass('/radno-vrijeme')}
              data-testid="nav-hours"
            >
              <Clock className="w-4 h-4" />
              <span>Vrijeme</span>
            </Link>
            <Link
              to="/rezervacije"
              className={navLinkClass('/rezervacije')}
              data-testid="nav-bookings"
            >
              <Calendar className="w-4 h-4" />
              <span>Rezervacije</span>
            </Link>
            <Link
              to="/postavke"
              className={navLinkClass('/postavke')}
              data-testid="nav-settings"
            >
              <Settings className="w-4 h-4" />
              <span>Postavke</span>
            </Link>
            
            <div className="h-8 w-px bg-gray-200 mx-3"></div>
            
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{user?.name?.charAt(0)}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl p-2.5 transition-all"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Header Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl p-2 transition-all"
              data-testid="logout-button-mobile"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
