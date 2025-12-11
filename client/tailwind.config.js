/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // New Holographic Palette
                'holo-space': '#050a14',      // Deepest background
                'holo-dock': 'rgba(10, 20, 40, 0.7)', // Dock background
                'holo-ice': '#e0f2fe',        // Highlighting/Text
                'holo-cyan': '#00f3ff',       // Primary accent (Hologram)
                'holo-violet': '#8b5cf6',     // Secondary accent
                'holo-border': 'rgba(0, 243, 255, 0.2)',
                'glass-surface': 'rgba(255, 255, 255, 0.03)',
            },
            fontFamily: {
                'tech': ['Inter', 'sans-serif'], // Professional/Tech
                'code': ['Fira Code', 'monospace'], // Data display
            },
            animation: {
                'float-panel': 'floatPanel 6s ease-in-out infinite',
                'dock-slide': 'dockSlide 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                'laser-etch': 'laserEtch 2s linear forwards',
                'prism-spin': 'prismSpin 20s linear infinite',
                'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
                'shimmer-band': 'shimmerBand 2s linear infinite',
            },
            keyframes: {
                floatPanel: {
                    '0%, 100%': { transform: 'translateY(0) rotateX(2deg)' },
                    '50%': { transform: 'translateY(-15px) rotateX(2deg)' },
                },
                dockSlide: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                laserEtch: {
                    '0%': { width: '0%', opacity: '0' },
                    '100%': { width: '100%', opacity: '1' },
                },
                prismSpin: {
                    '0%': { transform: 'rotateY(0deg) rotateX(10deg)' },
                    '100%': { transform: 'rotateY(360deg) rotateX(10deg)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)' },
                    '50%': { boxShadow: '0 0 25px rgba(0, 243, 255, 0.5)' },
                },
                shimmerBand: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                }
            },
            perspective: {
                '1000': '1000px',
            },
            boxShadow: {
                'holo': '0 0 20px rgba(0, 243, 255, 0.1), inset 0 0 20px rgba(0, 243, 255, 0.05)',
                'holo-lg': '0 10px 40px rgba(0, 243, 255, 0.15), inset 0 0 30px rgba(0, 243, 255, 0.1)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
