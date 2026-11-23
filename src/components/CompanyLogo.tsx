import React from 'react';

export function NexusPlaceMark({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="#065F46" />
      <path
        d="M10 22V10.5L22 21.5V10.5"
        stroke="#ECFDF5"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="10.5" r="2.1" fill="#F59E0B" />
    </svg>
  );
}

interface CompanyLogoProps {
  companyName: string;
  accentHex: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CompanyLogo({ companyName, accentHex, size = 'md' }: CompanyLogoProps) {
  const words = companyName.replace(/\./g, '').trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : companyName.slice(0, 2).toUpperCase();

  const sizeClass =
    size === 'sm'
      ? 'w-9 h-9 text-xs rounded-xl'
      : size === 'lg'
        ? 'w-12 h-12 text-base rounded-2xl'
        : 'w-10 h-10 text-sm rounded-xl';

  return (
    <div
      className={`${sizeClass} company-logo-badge relative flex items-center justify-center font-display font-bold shrink-0 bg-white dark:bg-slate-100 border border-[#E8E3DA] select-none overflow-hidden`}
      style={{
        color: accentHex,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundColor: accentHex }}
      />
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 w-full h-full opacity-15"
        fill="none"
      >
        <path
          d="M0 30L30 0M10 40L40 10"
          stroke={accentHex}
          strokeWidth="1.2"
        />
      </svg>
      <span className="relative z-10 tracking-tight">{initials}</span>
    </div>
  );
}
