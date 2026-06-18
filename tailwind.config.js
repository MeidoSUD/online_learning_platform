const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Cairo', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: '#3A86FF',
                secondary: '#06D6A0',
                accent: '#8338EC',
                background: '#F8FAFC',
                surface: '#FFFFFF',
                text: '#2E2E2E',
            },
        },
    },

    plugins: [require('@tailwindcss/forms')],
};
