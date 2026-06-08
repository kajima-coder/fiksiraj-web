import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Briefcase, Settings } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Početna' },
    { path: '/rezervacije', icon: Calendar, label: 'Rezervacije' },
    { path: '/usluge', icon: Briefcase, label: 'Usluge' },
    { path: '/postavke', icon: Settings, label: 'Postavke' },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Glavna navigacija">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`mobile-nav-item ${isActive(item.path) ? 'mobile-nav-item-active' : ''}`}
          data-testid={`mobile-nav-${item.path.slice(1)}`}
          aria-current={isActive(item.path) ? 'page' : undefined}
        >
          <item.icon className="mobile-nav-icon" strokeWidth={isActive(item.path) ? 2.5 : 2} />
          <span className="mobile-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
