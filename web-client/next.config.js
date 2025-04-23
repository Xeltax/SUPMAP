/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        API_URL: process.env.API_URL,
        TOMTOM_API_KEY: process.env.TOMTOM_API_KEY
    },
    images: {
        domains: ['api.tomtom.com'],
    }
}

module.exports = nextConfig