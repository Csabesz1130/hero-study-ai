/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.alias = {
                ...(config.resolve.alias || {}),
                undici: false,
            };
            config.resolve.fallback = {
                ...config.resolve.fallback,
                undici: false,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
    transpilePackages: ['undici'],
};

module.exports = nextConfig; 