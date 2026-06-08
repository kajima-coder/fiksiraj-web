import React from 'react';

/**
 * UserAvatar component - displays initials-based avatar
 * @param {string} name - User's full name
 * @param {string} size - 'sm', 'md', 'lg', 'xl'
 * @param {string} className - Additional classes
 */
const UserAvatar = ({ name = '', size = 'md', className = '' }) => {
  // Generate initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Generate consistent color based on name
  const getGradient = (fullName) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-600',
      'from-fuchsia-500 to-purple-600',
      'from-lime-500 to-green-600',
    ];
    
    if (!fullName) return gradients[0];
    
    // Simple hash based on name
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const initials = getInitials(name);
  const gradient = getGradient(name);

  return (
    <div 
      className={`
        ${sizeClasses[size] || sizeClasses.md}
        bg-gradient-to-br ${gradient}
        rounded-2xl flex items-center justify-center
        font-bold text-white shadow-lg
        ${className}
      `}
      title={name}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
