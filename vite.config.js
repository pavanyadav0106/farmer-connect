import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'main.html'),
        contact: resolve(__dirname, 'contact.html'),
        faq: resolve(__dirname, 'faq.html'),
        license: resolve(__dirname, 'license.html'),
        // Farmer Pages (renamed for consistency)
        farmerDashboard: resolve(__dirname, 'farmer-dashboard.html'),
        farmerCrops: resolve(__dirname, 'farmer-crops.html'),
        farmerProfile: resolve(__dirname, 'farmer-profile.html'),
        farmerOrders: resolve(__dirname, 'farmer-orders.html'),
        // Customer Pages
        customerDashboard: resolve(__dirname, 'customer-dashboard.html'),
        customerMarketplace: resolve(__dirname, 'customer-marketplace.html'),
        customerCart: resolve(__dirname, 'customer-cart.html'),
        customerOrders: resolve(__dirname, 'customer-orders.html'),
        customerProfile: resolve(__dirname, 'customer-profile.html')
      }
    }
  }
});
