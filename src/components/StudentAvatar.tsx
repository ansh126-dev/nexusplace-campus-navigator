import React from 'react';

export function resolveCustomAvatarUrl(avatarUrl?: string): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.includes('/src/assets/images/avatar_student_')) {
    return undefined;
  }
  return avatarUrl;
}

interface StudentAvatarProps {
  avatarUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StudentAvatar({
  avatarUrl,
  name,
  size = 'md',
  className = '',
}: StudentAvatarProps) {
  const customUrl = resolveCustomAvatarUrl(avatarUrl);

  const sizeClass =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg'
      : size === 'lg'
        ? 'w-20 h-20 rounded-2xl'
        : 'w-9 h-9 rounded-xl';

  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${sizeClass} object-cover border border-[#E8E3DA] shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} overflow-hidden border border-[#E8E3DA] shrink-0 select-none ${className}`}
      aria-label={`${name} avatar`}
      role="img"
    >
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full block" aria-hidden="true">
        <rect width="40" height="40" fill="#064E3B" />
        <circle cx="33" cy="7" r="11" fill="#F59E0B" fillOpacity="0.22" />
        <circle cx="20" cy="15.5" r="5.8" fill="#ECFDF5" />
        <path
          d="M9.5 34.5C9.5 28.4249 14.201 23.5 20 23.5C25.799 23.5 30.5 28.4249 30.5 34.5V37H9.5V34.5Z"
          fill="#D1FAE5"
        />
      </svg>
    </div>
  );
}
