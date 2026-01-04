import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('/api/omikuji/draw', () => {
  beforeEach(() => {
    // Clear any mocks
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should return omikuji result for valid request', async () => {
      // Given
      const requestBody = {
        typeId: 'engineer-fortune',
        saisenLevel: 0
      };

      const request = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.data.omikujiType).toBeDefined();
      expect(data.data.fortune).toBeDefined();
    });

    it('should return error for invalid typeId', async () => {
      // Given
      const requestBody = {
        typeId: 'invalid-type',
        saisenLevel: 0
      };

      const request = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('FORTUNE_DATA_NOT_FOUND');
      expect(data.error.message).toContain('typeId');
    });

    it('should return error for missing typeId', async () => {
      // Given
      const requestBody = {
        saisenLevel: 0
      };

      const request = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('typeId');
    });

    it('should handle invalid JSON in request body', async () => {
      // Given
      const request = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json'
      });

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_JSON');
    });

    it('should handle optional saisenLevel parameter', async () => {
      // Given
      const requestBody = {
        typeId: 'engineer-fortune'
        // saisenLevel omitted
      };

      const request = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should validate saisenLevel range', async () => {
      // Given
      const requestBody = {
        typeId: 'engineer-fortune',
        saisenLevel: -1 // Invalid: negative
      };

      const request = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('saisenLevel');
    });

    it('should handle repository errors gracefully', async () => {
      // Given - This test might need mocking repository dependencies
      const requestBody = {
        typeId: 'engineer-fortune',
        saisenLevel: 0
      };

      // Mock repository to throw error
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Repository error')));

      const request = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});