/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vantablack: '#000000',
        obsidian: {
          950: '#030303',
          900: '#070707',
          850: '#0C0C0C',
          800: '#121212',
          700: '#1A1A1A',
          600: '#262626',
        },
        tactical: {
          orange: '#FF5500',
          orangeHover: '#E04B00',
          subtle: 'rgba(255, 85, 0, 0.12)',
        },
        triage: {
          red: '#F43F5E',
          yellow: '#F59E0B',
          green: '#10B981',
        },
        mono: {
          border: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.04)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Mono"', '"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'sharp': '0 0 0 1px rgba(255, 255, 255, 0.08)',
        'elevated': '0 20px 40px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'shake': 'shake 0.4s ease-in-out',
        'subtle-pulse': 'subtlePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radarSweep 8s linear infinite',
      }
    },
  },
  plugins: [],
}
