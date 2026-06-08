import { 
  Wrench, 
  Zap, 
  Paintbrush, 
  Car, 
  Sparkles, 
  Hammer, 
  Home,
  Thermometer,
  Scissors,
  Truck,
  Settings,
  Leaf
} from 'lucide-react';

/**
 * Service category icons and colors mapping
 */
export const SERVICE_CATEGORIES = {
  // Plumbing/Water
  'Vodoinstalater': { icon: Wrench, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  'Plinoinstalater': { icon: Wrench, gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
  
  // Electrical
  'Električar': { icon: Zap, gradient: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-50' },
  
  // Painting/Finishing
  'Soboslikar': { icon: Paintbrush, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
  'Fasader': { icon: Paintbrush, gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
  'Knaufer': { icon: Home, gradient: 'from-slate-500 to-gray-600', bg: 'bg-slate-50' },
  
  // Construction
  'Zidar': { icon: Hammer, gradient: 'from-stone-500 to-stone-600', bg: 'bg-stone-50' },
  'Tesar': { icon: Hammer, gradient: 'from-amber-600 to-yellow-600', bg: 'bg-amber-50' },
  'Krovopokrivač': { icon: Home, gradient: 'from-red-500 to-rose-500', bg: 'bg-red-50' },
  'Građevinski radovi': { icon: Hammer, gradient: 'from-gray-500 to-slate-600', bg: 'bg-gray-50' },
  'Adaptacije stanova': { icon: Home, gradient: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50' },
  
  // Flooring
  'Keramičar': { icon: Home, gradient: 'from-teal-500 to-emerald-500', bg: 'bg-teal-50' },
  'Parketar': { icon: Home, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  
  // HVAC
  'Instalater grijanja i klimatizacije': { icon: Thermometer, gradient: 'from-sky-500 to-blue-500', bg: 'bg-sky-50' },
  'Serviser klima uređaja': { icon: Thermometer, gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50' },
  
  // Automotive
  'Automehaničar': { icon: Car, gradient: 'from-zinc-500 to-gray-600', bg: 'bg-zinc-50' },
  'Autolimar': { icon: Car, gradient: 'from-neutral-500 to-stone-600', bg: 'bg-neutral-50' },
  
  // Cleaning
  'Čistač/ica': { icon: Sparkles, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50' },
  
  // Moving
  'Selidbe i prijevoz': { icon: Truck, gradient: 'from-blue-600 to-indigo-600', bg: 'bg-blue-50' },
  
  // Other trades
  'Stolar': { icon: Hammer, gradient: 'from-yellow-700 to-amber-700', bg: 'bg-yellow-50' },
  'Bravar': { icon: Settings, gradient: 'from-gray-600 to-zinc-600', bg: 'bg-gray-50' },
  'Staklar': { icon: Home, gradient: 'from-sky-400 to-cyan-400', bg: 'bg-sky-50' },
  'Dimnjačar': { icon: Home, gradient: 'from-stone-600 to-gray-700', bg: 'bg-stone-50' },
  'Vrtlar': { icon: Leaf, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
  'Monter namještaja': { icon: Hammer, gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-50' },
  'Serviser bijele tehnike': { icon: Settings, gradient: 'from-slate-500 to-gray-500', bg: 'bg-slate-50' },
  'Limar': { icon: Hammer, gradient: 'from-zinc-500 to-slate-500', bg: 'bg-zinc-50' },
};

// Default category for unknown services
export const DEFAULT_CATEGORY = { 
  icon: Wrench, 
  gradient: 'from-primary to-blue-600', 
  bg: 'bg-blue-50' 
};

/**
 * Get category info for a service/profession
 */
export const getServiceCategory = (serviceName) => {
  // Try exact match first
  if (SERVICE_CATEGORIES[serviceName]) {
    return SERVICE_CATEGORIES[serviceName];
  }
  
  // Try partial match
  const lowerName = serviceName?.toLowerCase() || '';
  for (const [key, value] of Object.entries(SERVICE_CATEGORIES)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }
  
  return DEFAULT_CATEGORY;
};

/**
 * ServiceIcon component
 */
const ServiceIcon = ({ serviceName, size = 'md', className = '' }) => {
  const category = getServiceCategory(serviceName);
  const Icon = category.icon;
  
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
    xl: 'w-16 h-16 p-3',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-br ${category.gradient}
        rounded-2xl flex items-center justify-center
        shadow-lg
        ${className}
      `}
      title={serviceName}
    >
      <Icon className={`${iconSizes[size]} text-white`} />
    </div>
  );
};

export default ServiceIcon;
