import React from 'react';
import { Link } from 'react-router-dom';

interface GarminCardProps {
  to?: string;
  className?: string;
  children: React.ReactNode;
}

export function GarminCard({ to, className = '', children }: GarminCardProps) {
  // We use standard light mode colors here to match the Garmin Connect UI
  const baseClasses = `bg-white text-gray-900 rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col ${className}`;
  
  if (to) {
    return (
      <Link to={to} className={`${baseClasses} hover:shadow-md transition-shadow cursor-pointer block`}>
        {children}
      </Link>
    );
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
}

export function CardHeader({ children, title, icon: Icon, className = '' }: { children?: React.ReactNode, title?: string, icon?: React.ComponentType<{ className?: string }>, className?: string }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
        {Icon && <Icon className="w-5 h-5 text-[#007cc3]" />}
        {title && <span>{title}</span>}
      </div>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-4 flex-1 flex flex-col ${className}`}>
      {children}
    </div>
  );
}
