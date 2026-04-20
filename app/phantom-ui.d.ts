import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'phantom-ui': React.HTMLAttributes<HTMLElement> & {
        loading?: boolean;
        animation?: 'shimmer' | 'pulse' | 'breathe' | 'solid';
        reveal?: string | number; // Fixed: accepts "0.4" or 0.4
        count?: string | number;  // Fixed
        'count-gap'?: string | number; // Fixed
        stagger?: string | number; // Fixed
        duration?: string | number; // Fixed
        'shimmer-direction'?: 'ltr' | 'rtl' | 'ttb' | 'btt';
        'shimmer-color'?: string;
        'background-color'?: string;
        'fallback-radius'?: string | number; // Fixed
      };
    }
  }
}