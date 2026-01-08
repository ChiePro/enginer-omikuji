import { describe, it, expect } from 'vitest';
import nextConfig from '../../../next.config';

describe('Security Headers Configuration', () => {
  describe('headers function', () => {
    it('should have headers function defined', () => {
      expect(typeof nextConfig.headers).toBe('function');
    });

    it('should return security headers for all routes', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function is not defined');
      }

      const headers = await nextConfig.headers();

      expect(Array.isArray(headers)).toBe(true);
      expect(headers.length).toBeGreaterThan(0);

      const allRoutesConfig = headers.find(h => h.source === '/:path*');
      expect(allRoutesConfig).toBeDefined();
    });

    it('should include X-Frame-Options header with DENY value', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function is not defined');
      }

      const headers = await nextConfig.headers();
      const allRoutesConfig = headers.find(h => h.source === '/:path*');

      const xFrameOptions = allRoutesConfig?.headers.find(
        h => h.key === 'X-Frame-Options'
      );

      expect(xFrameOptions).toBeDefined();
      expect(xFrameOptions?.value).toBe('DENY');
    });

    it('should include X-Content-Type-Options header with nosniff value', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function is not defined');
      }

      const headers = await nextConfig.headers();
      const allRoutesConfig = headers.find(h => h.source === '/:path*');

      const xContentTypeOptions = allRoutesConfig?.headers.find(
        h => h.key === 'X-Content-Type-Options'
      );

      expect(xContentTypeOptions).toBeDefined();
      expect(xContentTypeOptions?.value).toBe('nosniff');
    });

    it('should include Referrer-Policy header with strict-origin-when-cross-origin value', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function is not defined');
      }

      const headers = await nextConfig.headers();
      const allRoutesConfig = headers.find(h => h.source === '/:path*');

      const referrerPolicy = allRoutesConfig?.headers.find(
        h => h.key === 'Referrer-Policy'
      );

      expect(referrerPolicy).toBeDefined();
      expect(referrerPolicy?.value).toBe('strict-origin-when-cross-origin');
    });

    it('should include Strict-Transport-Security header with proper HSTS value', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function is not defined');
      }

      const headers = await nextConfig.headers();
      const allRoutesConfig = headers.find(h => h.source === '/:path*');

      const hsts = allRoutesConfig?.headers.find(
        h => h.key === 'Strict-Transport-Security'
      );

      expect(hsts).toBeDefined();
      expect(hsts?.value).toBe('max-age=31536000; includeSubDomains');
    });

    it('should contain all four required security headers', async () => {
      if (!nextConfig.headers) {
        throw new Error('headers function is not defined');
      }

      const headers = await nextConfig.headers();
      const allRoutesConfig = headers.find(h => h.source === '/:path*');

      expect(allRoutesConfig?.headers.length).toBeGreaterThanOrEqual(4);

      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Strict-Transport-Security'
      ];

      for (const headerName of requiredHeaders) {
        const header = allRoutesConfig?.headers.find(h => h.key === headerName);
        expect(header).toBeDefined();
      }
    });
  });
});
