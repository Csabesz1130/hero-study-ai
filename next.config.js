/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        // Az undici csomag kihagyása a kliens bundlingből
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            undici: false,
        };
        return config;
    },
    transpilePackages: ['undici'],
};

module.exports = nextConfig; 