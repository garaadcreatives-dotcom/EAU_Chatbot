import React from 'react';

// Modern Minimalist Icons (ChatGPT / Gemini style)
export const ModernCopyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8.5" y="8.5" width="12.5" height="12.5" rx="3.5" ry="3.5" />
    <path d="M4.5 15.5H4a2.5 2.5 0 0 1-2.5-2.5V4a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 15.5 4v0.5" />
  </svg>
);

export const ModernShareIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.5v3.5a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5V14.5" />
    <polyline points="17 7 12 2 7 7" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export const ModernEditIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 3a2.121 2.121 0 0 1 3 3L7.5 19 3 20.5 4.5 16 17.5 3z" />
  </svg>
);
