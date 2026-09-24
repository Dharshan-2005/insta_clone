import React from 'react';

interface InstagramLogoProps {
  className?: string;
  variant?: 'wordmark' | 'icon';
  size?: number;
}

export default function InstagramLogo({ className = '', variant = 'wordmark', size = 32 }: InstagramLogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="5.5"
          stroke="url(#ig-grad)"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="12" cy="12" r="4.2" stroke="url(#ig-grad)" strokeWidth="2" fill="none" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig-grad)" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 103 29"
      width="103"
      height="29"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Instagram"
    >
      <path d="M12.9 8.2c-.8 0-1.5.3-2.1.8l-.1-.7H8.8V22h2.1v-6.9c0-2.3 1.2-3.6 2.8-3.6 1.4 0 2.2.9 2.2 2.5V22H18v-7.8c0-3.3-1.8-6-5.1-6zm15.7 3.1h-2V9.9h2V8.4c0-2.2 1.2-3.5 3.3-3.5.9 0 1.7.2 2.1.4l-.5 1.7c-.3-.1-.7-.2-1.2-.2-1 0-1.6.6-1.6 1.8v1.3h2.6v1.4h-2.6V22h-2.1v-8.9l-.0.2zm11.7-3.1c-3.8 0-6.7 2.8-6.7 6.8 0 4 2.9 6.9 6.7 6.9 3.9 0 6.8-2.9 6.8-6.9 0-4-2.9-6.8-6.8-6.8zm0 11.8c-2.6 0-4.6-2.1-4.6-5s2-5 4.6-5 4.6 2.1 4.6 5-2 5-4.6 5zm17.9-11.8c-1.8 0-3.3.8-4.1 2.2V9.9h-2V22h2.1v-6.5c0-2.7 1.7-4.4 3.8-4.4 2.1 0 3.3 1.5 3.3 4.1V22h2.1v-6.9c0-3.8-2.2-6.9-5.2-6.9zm16.7 0c-3.8 0-6.7 2.8-6.7 6.8 0 4 2.9 6.9 6.7 6.9 3.9 0 6.8-2.9 6.8-6.9 0-4-2.9-6.8-6.8-6.8zm0 11.8c-2.6 0-4.6-2.1-4.6-5s2-5 4.6-5 4.6 2.1 4.6 5-2 5-4.6 5zm17.7-11.8c-2.8 0-4.9 1.7-5.5 4.1l1.9.7c.4-1.6 1.7-2.9 3.6-2.9 2 0 3.2 1.1 3.2 2.6v.5c-.7-.1-1.7-.2-2.7-.2-3.4 0-5.7 1.6-5.7 4.5 0 2.7 2 4.4 4.7 4.4 1.8 0 3.2-.8 3.8-2v1.8h2V14c0-3.4-2.3-5.8-5.8-5.8zm.5 11.8c-1.7 0-3-1-3-2.6 0-1.8 1.4-2.7 3.5-2.7.9 0 1.7.1 2.3.3-.2 3.1-1.4 5-2.8 5zM2.8 13.8c0-3.2 2.2-5.6 5.3-5.6 1.4 0 2.7.5 3.6 1.4l1.3-1.4C11.8 7 10 6.2 8.1 6.2 3.8 6.2.7 9.5.7 13.8c0 4.4 3.2 7.7 7.5 7.7 2.5 0 4.5-1.1 5.6-2.8l-1.4-1.2c-.8 1.2-2.3 2-4.2 2-3.1 0-5.4-2.5-5.4-5.7z"/>
    </svg>
  );
}
