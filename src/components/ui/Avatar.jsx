import { forwardRef } from 'react';
import clsx from 'clsx';

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

// Generates a consistent color from a name string
const avatarColors = [
  'bg-primary-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColor(name) {
  if (!name) return avatarColors[0];
  return avatarColors[hashString(name) % avatarColors.length];
}

const Avatar = forwardRef(function Avatar(
  {
    src,
    alt,
    name,
    size = 'md',
    className,
    ...props
  },
  ref
) {
  const initials = getInitials(name || alt);
  const bgColor = getColor(name || alt);

  if (src) {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt || name || 'Avatar'}
        className={clsx(
          'inline-flex rounded-full object-cover ring-2 ring-white',
          'transition-transform duration-200',
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white',
        'transition-transform duration-200 select-none',
        bgColor,
        sizes[size],
        className
      )}
      title={name || alt}
      {...props}
    >
      {initials}
    </span>
  );
});

export default Avatar;
