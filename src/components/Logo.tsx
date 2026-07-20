import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';
import { ToviaLogo } from './ToviaLogo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white';
  showTagline?: boolean;
}

export default function Logo({ className, variant = 'default', showTagline = true }: LogoProps) {
  const colorClass = variant === 'white' ? 'text-white' : 'text-primary';

  return (
    <Link to="/" className={cn("flex items-center gap-3 transition-opacity hover:opacity-80", className)}>
      <ToviaLogo className={cn("h-10 w-auto", colorClass)} />
      {showTagline && (
        <div className={cn("hidden sm:block text-xs font-bold tracking-widest uppercase opacity-80 border-l-2 pl-3 leading-tight", colorClass, variant === 'white' ? 'border-white/20' : 'border-primary/20')}>
          Gestão de<br />Eventos
        </div>
      )}
    </Link>
  );
}
