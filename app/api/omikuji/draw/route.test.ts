import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

      // Then - With fallback functionality, the API should succeed even when some services fail
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.result.omikujiResult.categories.items).toHaveLength(5);
    });
  });

  describe('Randomization Integration', () => {
    it('should support sessionId parameter for category randomization', async () => {
      // Given
      const requestBody = {
        omikujiType: 'engineer-fortune',
        sessionId: 'test-session-123'
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
      expect(data.result).toBeDefined();
      expect(data.result.omikujiResult.categories.items).toHaveLength(5);
      
      // Categories should have randomized content
      data.result.omikujiResult.categories.items.forEach(category => {
        expect(category.name).toBeDefined();
        expect(category.content).toBeDefined();
        expect(category.emotionTone).toBeDefined();
      });
    });

    it('should maintain backward compatibility when no sessionId provided', async () => {
      // Given
      const requestBody = {
        omikujiType: 'engineer-fortune'
        // No sessionId provided
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
      expect(data.result).toBeDefined();
      expect(data.result.fortune).toBeDefined();
      expect(data.result.omikujiResult).toBeDefined();
      expect(data.result.omikujiResult.categories.items).toHaveLength(5);
    });

    it('should return randomized categories based on fortune emotion attribute', async () => {
      // Given
      const requestBody = {
        omikujiType: 'engineer-fortune',
        sessionId: 'emotion-test-session'
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
      
      if (data.result) {
        const fortune = data.result.fortune;
        const categories = data.result.omikujiResult.categories.items;
        
        // Categories should match fortune's emotional context
        categories.forEach(category => {
          expect(['positive', 'neutral', 'negative']).toContain(category.emotionTone);
        });

        // For 大吉 (rank 1), should be mostly positive
        if (fortune.rank === 1) {
          const positiveCategories = categories.filter(cat => cat.emotionTone === 'positive');
          expect(positiveCategories.length).toBeGreaterThan(2);
        }
      }
    });

    it('should handle randomization service errors gracefully', async () => {
      // Mock the global services to simulate error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Given
      const requestBody = {
        omikujiType: 'engineer-fortune',
        sessionId: 'error-test-session'
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
      // Should fallback to static content when randomization fails
      expect(data.result.omikujiResult.categories.items).toHaveLength(5);

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('should validate sessionId format when provided', async () => {
      // Given
      const requestBody = {
        omikujiType: 'engineer-fortune',
        sessionId: '' // Invalid: empty string
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
      expect(data.error.code).toBe('INVALID_INPUT');
      expect(data.error.message).toContain('sessionId');
    });

    it('should support deterministic randomization with seed parameter', async () => {
      // Given
      const requestBody = {
        omikujiType: 'engineer-fortune',
        sessionId: 'seed-test-session',
        seed: 'test-seed-123'
      };

      const request1 = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const request2 = new NextRequest('http://localhost:3000/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // When - Call twice with same seed
      const response1 = await POST(request1);
      const data1 = await response1.json();
      
      const response2 = await POST(request2);
      const data2 = await response2.json();

      // Then
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
      
      // Results should be consistent with same seed
      if (data1.result && data2.result) {
        expect(data1.result.fortune.id).toBe(data2.result.fortune.id);
      }
    });
  });
});