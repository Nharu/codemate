import type { NextConfig } from 'next';
import path from 'path';

const CDN_DOMAIN = process.env.CDN_DOMAIN || '';

const nextConfig: NextConfig = {
    output: 'standalone',
    outputFileTracingRoot: path.join(__dirname, '../../'),
    // Skip lint and type check only in CI (performed locally via pre-commit hook)
    eslint: {
        ignoreDuringBuilds: process.env.CI === 'true',
    },
    typescript: {
        ignoreBuildErrors: process.env.CI === 'true',
    },
    images: {
        remotePatterns: [
            // 로컬 개발 환경 (MinIO)
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '9000',
                pathname: '/codemate-uploads/**',
            },
            // 프로덕션 환경 (CloudFront)
            ...(CDN_DOMAIN
                ? [
                      {
                          protocol: 'https' as const,
                          hostname: CDN_DOMAIN,
                          pathname: '/**',
                      },
                  ]
                : []),
        ],
    },
};

export default nextConfig;
