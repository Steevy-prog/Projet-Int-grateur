import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — deep forest greens
        forest: {
          50:  '#f2f7f2',
          100: '#e0ede0',
          200: '#c2dbc3',
          300: '#96c098',
          400: '#649f67',
          500: '#437f46',
          600: '#316435',
          700: '#27502b',
          800: '#204124',
          900: '#1a361e',
          950: '#0d1f10',
        },
        // Accent — warm amber/gold
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Neutral — warm off-whites and charcoals
        soil: {
          50:  '#faf9f7',
          100: '#f2f0ec',
          200: '#e6e2da',
          300: '#d4cfc4',
          400: '#b8b0a0',
          500: '#9c9080',
          600: '#7d7264',
          700: '#635a4e',
          800: '#4a4238',
          900: '#2e2820',
          950: '#1a1510',
        },
        // Status colors
        status: {
          success: '#4ade80',
          warning: '#fbbf24',
          danger:  '#f87171',
          info:    '#60a5fa',
        },
      },

      fontFamily: {
        display: ['Cabinet Grotesk', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      borderRadius: {
        '4xl': '2rem',
      },

      boxShadow: {
        'card':    '0 1px 3px 0 rgba(26,21,16,0.06), 0 4px 16px -2px rgba(26,21,16,0.08)',
        'card-lg': '0 4px 6px -1px rgba(26,21,16,0.08), 0 12px 32px -4px rgba(26,21,16,0.12)',
        'glow-green': '0 0 20px rgba(67,127,70,0.25)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.30)',
        'inner-sm': 'inset 0 1px 3px rgba(26,21,16,0.08)',
      },

      backgroundImage: {
        'gradient-radial':    'radial-gradient(var(--tw-gradient-stops))',
        'noise':              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },

      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.85)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        'fade-in':      'fade-in 0.4s ease-out forwards',
        'fade-in-left': 'fade-in-left 0.4s ease-out forwards',
        'slide-down':   'slide-down 0.3s ease-out forwards',
        'pulse-dot':    'pulse-dot 2s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

export default config
