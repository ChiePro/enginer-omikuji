import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import type { OmikujiDrawRequest, OmikujiDrawResponse, OmikujiType } from '../../types/omikuji';
import { JsonOmikujiResultRepository } from '../../infrastructure/repositories/json/JsonOmikujiResultRepository';
import { JsonFortuneRepository } from '../../infrastructure/repositories/json/FortuneRepository';

describe('Omikuji End-to-End Flow Integration Tests', () => {
  const omikujiTypes: OmikujiType[] = [
    'engineer-fortune',
    'tech-selection', 
    'debug-fortune',
    'code-review-fortune',
    'deploy-fortune'
  ];

  const fortuneTypes = ['daikichi', 'chukichi', 'kichi', 'shokichi', 'suekichi', 'kyo', 'daikyo'];

  describe('Complete user flow for each omikuji type', () => {
    omikujiTypes.forEach(omikujiType => {
      it(`should complete full flow for ${omikujiType}`, async () => {
        // 1. Draw omikuji
        const drawRequest: OmikujiDrawRequest = {
          omikujiType,
          monetaryAmount: 100 // Standard amount
        };

        const response = await request(app)
          .post('/api/omikuji/draw')
          .send(drawRequest)
          .expect(200);

        const drawResult: OmikujiDrawResponse = response.body;

        // Verify response structure
        expect(drawResult.success).toBe(true);
        expect(drawResult.result).toBeDefined();
        expect(drawResult.result?.fortune).toBeDefined();
        expect(drawResult.result?.omikujiResult).toBeDefined();
        
        // Verify fortune type is valid
        expect(fortuneTypes).toContain(drawResult.result?.fortune.id);
        
        // Verify omikuji result content
        const result = drawResult.result?.omikujiResult;
        expect(result?.titlePhrase).toBeDefined();
        expect(result?.titlePhrase.length).toBeGreaterThanOrEqual(20);
        expect(result?.titlePhrase.length).toBeLessThanOrEqual(40);
        
        expect(result?.description).toBeDefined();
        expect(result?.description.length).toBeGreaterThanOrEqual(100);
        expect(result?.description.length).toBeLessThanOrEqual(300);
        
        expect(result?.emotionAttribute).toMatch(/^(positive|neutral|negative)$/);
        
        // Verify categories
        expect(result?.categories).toHaveLength(5);
        const categoryNames = result?.categories.map(c => c.name);
        expect(categoryNames).toContain('恋愛運');
        expect(categoryNames).toContain('仕事運');
        expect(categoryNames).toContain('健康運');
        expect(categoryNames).toContain('金運');
        expect(categoryNames).toContain('学業運');

        // Each category should have valid emotion tone
        result?.categories.forEach(category => {
          expect(category.content).toBeDefined();
          expect(category.emotionTone).toMatch(/^(positive|neutral|negative)$/);
        });
      });
    });
  });

  describe('Fortune and result combinations', () => {
    it('should return appropriate results for each fortune level', async () => {
      // Test multiple draws to cover different fortune levels
      const drawPromises = Array.from({ length: 20 }, async () => {
        const response = await request(app)
          .post('/api/omikuji/draw')
          .send({
            omikujiType: 'engineer-fortune',
            monetaryAmount: 100
          });
        
        return response.body as OmikujiDrawResponse;
      });

      const results = await Promise.all(drawPromises);
      const fortuneIds = results
        .filter(r => r.success && r.result)
        .map(r => r.result!.fortune.id);

      // Verify we got various fortune types (might not get all in 20 draws)
      const uniqueFortunes = new Set(fortuneIds);
      expect(uniqueFortunes.size).toBeGreaterThan(1);
    });
  });

  describe('Emotion attribute distribution', () => {
    it('should return emotion attributes according to fortune level probabilities', async () => {
      // Test daikichi - should have high positive probability
      const results: OmikujiDrawResponse[] = [];
      
      // Mock FortuneRepository to always return daikichi
      const mockGetRandomFortune = vi.spyOn(JsonFortuneRepository.prototype, 'getRandomFortune');
      mockGetRandomFortune.mockResolvedValue({
        id: 'daikichi',
        name: '大吉',
        description: 'Great fortune',
        rank: 1
      });

      // Draw 50 times to check emotion distribution
      for (let i = 0; i < 50; i++) {
        const response = await request(app)
          .post('/api/omikuji/draw')
          .send({
            omikujiType: 'engineer-fortune',
            monetaryAmount: 100
          });
        
        results.push(response.body);
      }

      // Count emotion attributes
      const emotionCounts = {
        positive: 0,
        neutral: 0,
        negative: 0
      };

      results.forEach(result => {
        if (result.success && result.result?.omikujiResult?.emotionAttribute) {
          emotionCounts[result.result.omikujiResult.emotionAttribute]++;
        }
      });

      // For daikichi, positive should be predominant (around 80%)
      const positiveRatio = emotionCounts.positive / 50;
      expect(positiveRatio).toBeGreaterThan(0.6); // Allow for randomness
      expect(positiveRatio).toBeLessThan(0.95);

      mockGetRandomFortune.mockRestore();
    });
  });

  describe('Different monetary amounts', () => {
    const amounts = [0, 10, 100, 500, 1000, 10000];

    amounts.forEach(amount => {
      it(`should handle monetary amount of ${amount} yen`, async () => {
        const response = await request(app)
          .post('/api/omikuji/draw')
          .send({
            omikujiType: 'engineer-fortune',
            monetaryAmount: amount
          });

        expect(response.status).toBe(200);
        const result: OmikujiDrawResponse = response.body;
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
      });
    });
  });

  describe('Complete flow with UI simulation', () => {
    it('should handle complete user journey simulation', async () => {
      // Step 1: User selects omikuji type
      const selectedType = 'debug-fortune';
      
      // Step 2: User makes offering
      const monetaryAmount = 100;
      
      // Step 3: Draw omikuji
      const drawResponse = await request(app)
        .post('/api/omikuji/draw')
        .send({
          omikujiType: selectedType,
          monetaryAmount
        });

      expect(drawResponse.status).toBe(200);
      const drawResult: OmikujiDrawResponse = drawResponse.body;

      // Step 4: Verify result can be displayed
      expect(drawResult.success).toBe(true);
      expect(drawResult.result).toBeDefined();
      
      // Verify all necessary display data is present
      const displayData = drawResult.result;
      expect(displayData?.fortune.name).toBeDefined(); // For UI display
      expect(displayData?.omikujiResult.titlePhrase).toBeDefined();
      expect(displayData?.omikujiResult.description).toBeDefined();
      expect(displayData?.omikujiResult.categories).toHaveLength(5);
      
      // Verify emotion attribute for styling
      expect(displayData?.omikujiResult.emotionAttribute).toBeDefined();
    });
  });
});