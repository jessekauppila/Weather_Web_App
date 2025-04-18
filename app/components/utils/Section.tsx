import { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function Section({ 
  title, 
  subtitle, 
  children, 
  className = ''
}: SectionProps) {
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
      <div className="mt-1">{children}</div>
    </div>
  );
} 