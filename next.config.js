/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };

        // Az undici modul problémájának kezelése
        config.module.rules.push({
            test: /node_modules\/undici\/lib\/web\/fetch\/util\.js$/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                },
            },
        });

        return config;
    },
};

module.exports = nextConfig; 