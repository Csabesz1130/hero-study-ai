/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['undici'],
    // SWC letiltása Windows 32-bit kompatibilitás miatt
    swcMinify: false,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Fallback-ek a Node.js modulokhoz
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                stream: false,
                url: false,
                zlib: false,
                http: false,
                https: false,
                assert: false,
                os: false,
                path: false,
            };

            // Undici alias a böngészőben
            config.resolve.alias = {
                ...config.resolve.alias,
                undici: false,
            };
        }
        return config;
    },
    // Firebase kompatibilitás
    experimental: {
        esmExternals: 'loose',
    }
};

module.exports = nextConfig; 