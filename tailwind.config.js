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
                sans: ['Cairo', 'Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: '#3D8B37',
                'primary-light': '#7DC242',
                'primary-pale': '#EDF6E4',
                secondary: '#00AEEF',
                'secondary-pale': '#E6F7FF',
                navy: '#1B3A6B',
                'navy-dark': '#0F2447',
                'navy-mid': '#2352A0',
                green: {
                    ...defaultTheme.colors.green,
                    DEFAULT: '#3D8B37',
                    light: '#7DC242',
                    pale: '#EDF6E4',
                },
                accent: '#00AEEF',
                'accent-pale': '#E6F7FF',
                'brand-blue': '#1B3A6B',
                'brand-green': '#3D8B37',
                background: '#F7FAFD',
                'light-bg': '#F7FAFD',
                surface: '#FFFFFF',
                text: '#1E2D42',
                'text-muted': '#687788',
                border: '#DEE8F0',
            },
        },
    },

    plugins: [require('@tailwindcss/forms')],
};
