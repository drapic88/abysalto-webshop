const fs = require('fs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Automatically detect if we are running inside a Docker container
    const isDocker = fs.existsSync('/.dockerenv') || fs.existsSync('/proc/self/cgroup') && fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');

    const catalogUrl = process.env.CATALOG_SERVICE_URL || (isDocker ? 'http://catalog-service:8081' : 'http://localhost:8081');
    const cartUrl = process.env.SHOPPING_CART_SERVICE_URL || (isDocker ? 'http://shopping-cart-service:8080' : 'http://localhost:8080');

    console.log(`>>> Next.js Proxy routing: isDocker=${isDocker}, catalogUrl=${catalogUrl}, cartUrl=${cartUrl}`);

    return [
      {
        source: '/api/products/:path*',
        destination: `${catalogUrl}/api/products/:path*`,
      },
      {
        source: '/api/carts/:path*',
        destination: `${cartUrl}/api/carts/:path*`,
      },
      {
        source: '/api/orders/:path*',
        destination: `${cartUrl}/api/orders/:path*`,
      },
      {
        source: '/api/metrics/:path*',
        destination: `${cartUrl}/api/metrics/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Force Webpack to poll for changes every second (essential for Docker-on-Windows volume mounts!)
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
