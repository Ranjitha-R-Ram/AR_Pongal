module.exports = {
    theme: {
      extend: {
        animation: {
          'steam': 'steam 2s infinite',
          'particle': 'particle 2s infinite',
        },
        keyframes: {
          steam: {
            '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0' },
            '50%': { transform: 'translateY(-20px) scale(1.5)', opacity: '0.7' },
          },
          particle: {
            '0%': { transform: 'rotate(var(--tw-rotate)) translateY(-40px) scale(1)', opacity: '1' },
            '100%': { transform: 'rotate(var(--tw-rotate)) translateY(-80px) scale(0)', opacity: '0' },
          },
        },
      },
    },
  }