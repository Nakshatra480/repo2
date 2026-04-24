/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // enable dark mode by default if needed, or rely on user preference
  theme: {
    extend: {
      colors: {
        background: "var(--bg-dark)",
        foreground: "var(--text-main)",
        card: "var(--bg-panel)",
        "card-foreground": "var(--text-main)",
        popover: "var(--bg-panel)",
        "popover-foreground": "var(--text-main)",
        primary: "var(--primary)",
        "primary-foreground": "#ffffff",
        secondary: "rgba(255, 255, 255, 0.1)",
        "secondary-foreground": "var(--text-main)",
        muted: "rgba(255, 255, 255, 0.1)",
        "muted-foreground": "var(--text-muted)",
        accent: "rgba(255, 255, 255, 0.1)",
        "accent-foreground": "var(--text-main)",
        border: "var(--border-color)",
        input: "var(--border-color)",
        ring: "var(--primary)",
      },
    },
  },
  plugins: [],
}
