/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand — indigo
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Dark surface palette
        dark: {
          bg:      '#080C12',   // page background
          card:    '#0F1623',   // card / panel surface
          surface: '#161F32',   // elevated surface
          raised:  '#1C2840',   // hover / raised state
          border:  '#1E2D47',   // default border
          muted:   '#8A99AD',   // muted text
        },
        // Semantic aliases
        success: {
          DEFAULT: '#10b981',
          muted:   'rgba(16,185,129,0.12)',
          border:  'rgba(16,185,129,0.3)',
          text:    '#6ee7b7',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted:   'rgba(245,158,11,0.12)',
          border:  'rgba(245,158,11,0.3)',
          text:    '#fcd34d',
        },
        danger: {
          DEFAULT: '#ef4444',
          muted:   'rgba(239,68,68,0.12)',
          border:  'rgba(239,68,68,0.3)',
          text:    '#fca5a5',
        },
        // Category colors
        cat: {
          work:     '#6366f1',
          study:    '#a855f7',
          personal: '#f59e0b',
          health:   '#10b981',
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem', { lineHeight: '1.125rem' }],
        sm:    ['0.8125rem', { lineHeight: '1.25rem' }],
        base:  ['0.875rem', { lineHeight: '1.375rem' }],
        lg:    ['1rem',     { lineHeight: '1.5rem' }],
        xl:    ['1.125rem', { lineHeight: '1.625rem' }],
        '2xl': ['1.25rem',  { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem',   { lineHeight: '2rem' }],
        '4xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },

      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
      },

      borderRadius: {
        DEFAULT: '0.5rem',
        sm:  '0.375rem',
        md:  '0.5rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      boxShadow: {
        'glow-indigo': '0 0 24px -4px rgba(99,102,241,0.45)',
        'glow-purple': '0 0 24px -4px rgba(168,85,247,0.45)',
        'glow-emerald': '0 0 24px -4px rgba(16,185,129,0.45)',
        'glow-amber':  '0 0 24px -4px rgba(245,158,11,0.35)',
        'glass':  '0 8px 32px rgba(0,0,0,0.4)',
        'card':   '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
        'modal':  '0 24px 64px rgba(0,0,0,0.7)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },

      backdropBlur: {
        xs: '2px',
      },

      animation: {
        'fade-in':    'fadeIn 0.2s ease-out both',
        'slide-up':   'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':    'shimmer 1.6s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow':  'spin 2s linear infinite',
        'bounce-sm':  'bounceSm 0.4s ease-in-out',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% center' },
          to:   { backgroundPosition: '200% center' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-3px)' },
        },
      },

      transitionTimingFunction: {
        'smooth':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },

      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
};
