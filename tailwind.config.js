/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        card: 'hsl(var(--card))',
        accent: 'hsl(var(--accent))',
        'accent-hover': 'hsl(var(--accent-hover))',
        'accent-light': 'hsl(var(--accent-light))',
        'accent-deep': 'hsl(var(--accent-deep))',
        text: 'hsl(var(--text))',
        'text-secondary': 'hsl(var(--text-secondary))',
        interactive: 'hsl(var(--interactive))',
        premium: 'hsl(var(--premium))',
        'premium-light': 'hsl(var(--premium-light))',
        error: 'hsl(var(--error))',
        'error-light': 'hsl(var(--error-light))',
        success: 'hsl(var(--success))',
        'success-light': 'hsl(var(--success-light))',
        warning: 'hsl(var(--warning))',
        'warning-light': 'hsl(var(--warning-light))',
        info: 'hsl(var(--info))',
        'info-light': 'hsl(var(--info-light))',
        border: 'hsl(var(--border))',
      },
      borderRadius: {
        'glass': '12px',
      },
      backdropBlur: {
        'glass': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
        'dropdown': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'modal': '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
        'tab': '0 2px 8px rgba(79, 70, 229, 0.15)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'accordion-down': 'accordionDown 0.2s ease-out',
        'accordion-up': 'accordionUp 0.2s ease-out',
        'tab-in': 'tabIn 0.35s ease-out',
        'tab-out': 'tabOut 0.2s ease-in',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'golden-shine': 'goldenShine 5.5s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        'golden-glow': 'goldenGlow 3.2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        accordionDown: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        accordionUp: {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        tabIn: {
          '0%': { transform: 'translateX(8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        tabOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-8px)', opacity: '0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        goldenShine: {
          '0%': { transform: 'translateX(-140%) skewX(-20deg)' },
          '55%, 100%': { transform: 'translateX(460%) skewX(-20deg)' },
        },
        goldenGlow: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
