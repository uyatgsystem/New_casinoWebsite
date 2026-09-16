/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      screens: {
        "3xl": "1620px",
      },
      backgroundImage: {
        "custom-gradient":
          "linear-gradient(90deg, #00F5D4 0%, #06B6D4 50%, #FF9F1C 100%)",
        "custom-gradient-border":
          "linear-gradient(0deg, #00F5D4 0%, #06B6D4 50%, #FF9F1C 100%)",
      },
      colors: {
        "gradient-start": "#00F5D4",
        "gradient-middle": "#06B6D4",
        "gradient-end": "#FF9F1C",
        "cyber-primary": "#00F5D4",
        "cyber-accent": "#06B6D4",
        "cyber-neon": "#FF9F1C",
        "cyber-dark": "#050811",
      },
    },
  },
  plugins: [],
};
