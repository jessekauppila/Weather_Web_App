import { ReactNode } from 'react';

interface DataSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export default function DataSection({
  title,
  subtitle,
  children,
  loading = false,
  error = null,
  className = '',
}: DataSectionProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {title && (
        <h3 
          className="text-sm font-semibold mb-1" 
          style={{ color: 'var(--app-text-primary, #c6c6c6)' }}
        >
          {title}
        </h3>
      )}
      {subtitle && (
        <p 
          className="text-xs mb-2"
          style={{ color: 'var(--app-text-secondary, #a3a3a3)' }}
        >
          {subtitle}
        </p>
      )}
      <div className="mt-1">
        {loading ? (
          <div className="flex items-center justify-center py-4 text-gray-400">
            <span className="mr-2">Loading...</span>
          </div>
        ) : error ? (
          <div className="py-4 text-red-400 text-sm">{error}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
} 