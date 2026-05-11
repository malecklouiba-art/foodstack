import Image from 'next/image';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const sizePx = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ src, alt = '', name, size = 'md', className }: AvatarProps) {
  const px = sizePx[size];

  if (src) {
    return (
      <div className={clsx('relative overflow-hidden rounded-full', sizeClasses[size], className)}>
        <Image src={src} alt={alt || name || 'Avatar'} width={px} height={px} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full bg-gradient-brand font-semibold text-white',
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
