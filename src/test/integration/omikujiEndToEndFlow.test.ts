import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../../app/api/omikuji/draw/route';
import { NextRequest } from 'next/server';
import type { OmikujiDrawRequest, OmikujiDrawResponse } from '../../../app/api/omikuji/draw/types';

// Helper function to call API endpoint
async function callOmikujiDraw(requestData: OmikujiDrawRequest) {
  const request = new NextRequest('http://localhost:3000/api/omikuji/draw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
  });

  const response = await POST(request);
  const data = await response.json();
  return { status: response.status, body: data };
}

describe('Omikuji End-to-End Flow Integration Tests', () => {
  const omikujiTypes = [
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
          saisenLevel: 2 // Standard amount
        };

        const response = await callOmikujiDraw(drawRequest);

        expect(response.status).toBe(200);
        const drawResult = response.body;

        // Verify response structure
        expect(drawResult.success).toBe(true);
        expect(drawResult.result).toBeDefined();
        expect(drawResult.result?.fortune).toBeDefined();
        expect(drawResult.result?.omikujiResult).toBeDefined();
        
        // Verify fortune type is valid
        expect(fortuneTypes).toContain(drawResult.result?.fortune.id);
        
        // Verify omikuji result content
        const result = drawResult.result?.omikujiResult;
        expect(result?.titlePhrase?.value).toBeDefined();
        expect(result?.titlePhrase?.value.length).toBeGreaterThanOrEqual(10);
        expect(result?.titlePhrase?.value.length).toBeLessThanOrEqual(100);
        
        expect(result?.description?.value).toBeDefined();
        expect(result?.description?.value.length).toBeGreaterThanOrEqual(20);
        expect(result?.description?.value.length).toBeLessThanOrEqual(500);
        
        expect(result?.emotionAttribute).toMatch(/^(positive|neutral|negative)$/);
        
        // Verify categories (randomized)
        expect(result?.categories?.items).toHaveLength(5);
        const categoryNames = result?.categories?.items.map(c => c.name);
        expect(categoryNames).toContain('恋愛運');
        expect(categoryNames).toContain('仕事運');
        expect(categoryNames).toContain('健康運');
        expect(categoryNames).toContain('金運');
        expect(categoryNames).toContain('学業運');

        // Each category should have valid emotion tone
        result?.categories?.items.forEach(category => {
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
        const response = await callOmikujiDraw({
          omikujiType: 'engineer-fortune',
          saisenLevel: 2
        });
        
        return response.body;
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
      // Draw multiple times to check emotion distribution for different fortunes
      const results = [];
      
      // Use seed to get more predictable distribution for testing
      for (let i = 0; i < 50; i++) {
        const response = await callOmikujiDraw({
          omikujiType: 'engineer-fortune',
          sessionId: `emotion-test-${i}`,
          seed: `emotion-${i}`
        });
        
        results.push(response.body);
      }

      // Count emotion attributes by fortune type
      const fortuneEmotions: { [fortuneId: string]: { positive: number; neutral: number; negative: number } } = {};

      results.forEach(result => {
        if (result.success && result.result) {
          const fortuneId = result.result.fortune.id;
          const emotionAttribute = result.result.omikujiResult.emotionAttribute;
          
          if (!fortuneEmotions[fortuneId]) {
            fortuneEmotions[fortuneId] = { positive: 0, neutral: 0, negative: 0 };
          }
          fortuneEmotions[fortuneId][emotionAttribute]++;
        }
      });

      // Verify that better fortunes tend to have more positive emotions
      Object.entries(fortuneEmotions).forEach(([fortuneId, emotions]) => {
        const total = emotions.positive + emotions.neutral + emotions.negative;
        if (total > 0) {
          const positiveRatio = emotions.positive / total;
          
          // Better fortunes should have higher positive ratios
          if (fortuneId === 'daikichi') {
            expect(positiveRatio).toBeGreaterThan(0.7);
          } else if (fortuneId === 'daikyo') {
            expect(positiveRatio).toBeLessThan(0.3);
          }
        }
      });
    });
  });

  describe('Different saisen levels', () => {
    const saisenLevels = [0, 1, 2, 3, 4, 5];

    saisenLevels.forEach(level => {
      it(`should handle saisen level of ${level}`, async () => {
        const response = await callOmikujiDraw({
          omikujiType: 'engineer-fortune',
          saisenLevel: level
        });

        expect(response.status).toBe(200);
        const result = response.body;
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
      const saisenLevel = 2;
      
      // Step 3: Draw omikuji
      const drawResponse = await callOmikujiDraw({
        omikujiType: selectedType,
        saisenLevel
      });

      expect(drawResponse.status).toBe(200);
      const drawResult = drawResponse.body;

      // Step 4: Verify result can be displayed
      expect(drawResult.success).toBe(true);
      expect(drawResult.result).toBeDefined();
      
      // Verify all necessary display data is present
      const displayData = drawResult.result;
      expect(displayData?.fortune.name).toBeDefined(); // For UI display
      expect(displayData?.omikujiResult.titlePhrase?.value).toBeDefined();
      expect(displayData?.omikujiResult.description?.value).toBeDefined();
      expect(displayData?.omikujiResult.categories?.items).toHaveLength(5);
      
      // Verify emotion attribute for styling
      expect(displayData?.omikujiResult.emotionAttribute).toBeDefined();
    });
  });

  describe('Fortune Randomization Flow Validation - Requirements 1.1-1.3, 2.1-2.5', () => {
    describe('Requirement 1.1: Independent category randomization', () => {
      it('should independently randomize each category when drawing the same fortune multiple times', async () => {
        const drawRequests = Array.from({ length: 20 }, (_, i) => ({
          omikujiType: 'engineer-fortune',
          sessionId: `req1-1-test-${i}`,
          seed: `test-seed-${i}`
        }));

        const results = await Promise.all(
          drawRequests.map(async req => {
            const response = await callOmikujiDraw(req);
            expect(response.status).toBe(200);
            return response;
          })
        );

        const categoryContentsByType: { [categoryName: string]: Set<string> } = {
          '恋愛運': new Set(),
          '仕事運': new Set(),
          '健康運': new Set(),
          '金運': new Set(),
          '学業運': new Set()
        };

        // Collect all category content variations
        results.forEach(response => {
          const result = response.body;
          if (result.success && result.result?.omikujiResult?.categories) {
            result.result.omikujiResult.categories.items.forEach((category: any) => {
              categoryContentsByType[category.name].add(category.content);
            });
          }
        });

        // Each category should have multiple content variations (independence)
        Object.entries(categoryContentsByType).forEach(([categoryName, contentSet]) => {
          expect(contentSet.size).toBeGreaterThan(1, 
            `${categoryName} should have multiple content variations for independent randomization`);
        });
      });
    });

    describe('Requirement 1.2: Different combinations for same main fortune', () => {
      it('should provide different category combinations when drawing the same main fortune consecutively', async () => {
        // Use deterministic seeds to ensure same fortune but different categories
        const sameFortuneSeed = 'same-fortune-test';
        const drawRequests = Array.from({ length: 10 }, (_, i) => ({
          omikujiType: 'engineer-fortune',
          sessionId: `req1-2-test-${i}`,
          seed: sameFortuneSeed
        }));

        const results = await Promise.all(
          drawRequests.map(async req => {
            const response = await callOmikujiDraw(req);
            expect(response.status).toBe(200);
            return response;
          })
        );

        const fortuneResults = results
          .map(r => r.body)
          .filter(r => r.success && r.result);

        // All should have same fortune
        const fortuneIds = fortuneResults.map(r => r.result.fortune.id);
        const uniqueFortuneIds = new Set(fortuneIds);
        expect(uniqueFortuneIds.size).toBe(1, 'All draws should have the same fortune when using same seed');

        // But categories should have different combinations
        const categoryContentCombinations = fortuneResults.map(r => {
          return r.result.omikujiResult.categories.items
            .map((cat: any) => `${cat.name}:${cat.content}`)
            .sort()
            .join('|');
        });

        const uniqueCombinations = new Set(categoryContentCombinations);
        expect(uniqueCombinations.size).toBeGreaterThan(1, 
          'Same fortune should produce different category combinations');
      });
    });

    describe('Requirement 1.3: Always include all 5 required categories', () => {
      it('should always include exactly 5 required categories in randomized results', async () => {
        const requiredCategories = ['恋愛運', '仕事運', '健康運', '金運', '学業運'];
        
        const results = await Promise.all(
          Array.from({ length: 15 }, async (_, i) => {
            const response = await callOmikujiDraw({
              omikujiType: 'engineer-fortune',
              sessionId: `req1-3-test-${i}`
            });
            expect(response.status).toBe(200);
            return response;
          })
        );

        results.forEach((response, index) => {
          const result = response.body;
          expect(result.success).toBe(true);
          
          const categories = result.result?.omikujiResult?.categories?.items || [];
          expect(categories).toHaveLength(5, `Result ${index} should have exactly 5 categories`);

          const categoryNames = categories.map((cat: any) => cat.name);
          requiredCategories.forEach(reqCategory => {
            expect(categoryNames).toContain(reqCategory, 
              `Result ${index} should contain required category: ${reqCategory}`);
          });
        });
      });
    });

    describe('Requirement 2.1: Daikichi (大吉) should have all positive emotion attributes', () => {
      it('should return all positive emotion attributes for daikichi fortune', async () => {
        const daikichResults: any[] = [];
        
        // Draw multiple times to catch daikichi results
        for (let i = 0; i < 50; i++) {
          const response = await callOmikujiDraw({
            omikujiType: 'engineer-fortune',
            sessionId: `req2-1-test-${i}`
          });

          expect(response.status).toBe(200);
          const result = response.body;
          if (result.success && result.result.fortune.id === 'daikichi') {
            daikichResults.push(result);
          }
        }

        expect(daikichResults.length).toBeGreaterThan(0, 'Should have at least some daikichi results');

        daikichResults.forEach((result, index) => {
          const categories = result.result.omikujiResult.categories.items;
          categories.forEach((category: any) => {
            expect(category.emotionTone).toBe('positive', 
              `Daikichi result ${index}, category ${category.name} should have positive emotion tone`);
          });
        });
      });
    });

    describe('Requirement 2.2: Daikyo (大凶) should have all negative emotion attributes', () => {
      it('should return all negative emotion attributes for daikyo fortune', async () => {
        const daikyoResults: any[] = [];
        
        // Draw multiple times to catch daikyo results  
        for (let i = 0; i < 100; i++) {
          const response = await callOmikujiDraw({
            omikujiType: 'engineer-fortune',
            sessionId: `req2-2-test-${i}`
          });

          expect(response.status).toBe(200);
          const result = response.body;
          if (result.success && result.result.fortune.id === 'daikyo') {
            daikyoResults.push(result);
          }
        }

        expect(daikyoResults.length).toBeGreaterThan(0, 'Should have at least some daikyo results');

        daikyoResults.forEach((result, index) => {
          const categories = result.result.omikujiResult.categories.items;
          categories.forEach((category: any) => {
            expect(category.emotionTone).toBe('negative', 
              `Daikyo result ${index}, category ${category.name} should have negative emotion tone`);
          });
        });
      });
    });

    describe('Requirement 2.3: Mid-level fortunes should have emotion distribution based on fortune ranking', () => {
      it('should have appropriate emotion distribution for chukichi, kichi, and shokichi', async () => {
        const fortuneEmotionData: { [fortuneId: string]: { positive: number; neutral: number; negative: number } } = {};
        
        // Collect data for mid-level fortunes
        for (let i = 0; i < 100; i++) {
          const response = await callOmikujiDraw({
            omikujiType: 'engineer-fortune',
            sessionId: `req2-3-test-${i}`
          });

          expect(response.status).toBe(200);
          const result = response.body;
          if (result.success) {
            const fortuneId = result.result.fortune.id;
            if (['chukichi', 'kichi', 'shokichi'].includes(fortuneId)) {
              if (!fortuneEmotionData[fortuneId]) {
                fortuneEmotionData[fortuneId] = { positive: 0, neutral: 0, negative: 0 };
              }

              const categories = result.result.omikujiResult.categories.items;
              categories.forEach((category: any) => {
                fortuneEmotionData[fortuneId][category.emotionTone]++;
              });
            }
          }
        }

        // Verify emotion distribution follows fortune ranking
        // chukichi (better) should have more positive than kichi, kichi more than shokichi
        Object.entries(fortuneEmotionData).forEach(([fortuneId, emotions]) => {
          const total = emotions.positive + emotions.neutral + emotions.negative;
          expect(total).toBeGreaterThan(0, `Should have data for ${fortuneId}`);

          const positiveRatio = emotions.positive / total;
          
          if (fortuneId === 'chukichi') {
            expect(positiveRatio).toBeGreaterThan(0.5, 'Chukichi should have majority positive emotions');
          } else if (fortuneId === 'kichi') {
            expect(positiveRatio).toBeGreaterThan(0.3, 'Kichi should have significant positive emotions');
          } else if (fortuneId === 'shokichi') {
            expect(positiveRatio).toBeLessThan(0.8, 'Shokichi should have balanced emotion distribution');
          }
        });
      });
    });

    describe('Requirement 2.4: Kyo (凶) should prioritize negative or neutral emotions', () => {
      it('should prioritize negative or neutral emotions for kyo fortune', async () => {
        const kyoResults: any[] = [];
        
        for (let i = 0; i < 100; i++) {
          const response = await callOmikujiDraw({
            omikujiType: 'engineer-fortune',
            sessionId: `req2-4-test-${i}`
          });

          expect(response.status).toBe(200);
          const result = response.body;
          if (result.success && result.result.fortune.id === 'kyo') {
            kyoResults.push(result);
          }
        }

        expect(kyoResults.length).toBeGreaterThan(0, 'Should have at least some kyo results');

        kyoResults.forEach((result, index) => {
          const categories = result.result.omikujiResult.categories.items;
          const emotionCounts = { positive: 0, neutral: 0, negative: 0 };
          
          categories.forEach((category: any) => {
            emotionCounts[category.emotionTone]++;
          });

          const nonPositiveCount = emotionCounts.neutral + emotionCounts.negative;
          const totalCount = emotionCounts.positive + emotionCounts.neutral + emotionCounts.negative;
          
          // Majority should be negative or neutral
          expect(nonPositiveCount / totalCount).toBeGreaterThan(0.5, 
            `Kyo result ${index} should prioritize negative or neutral emotions`);
        });
      });
    });

    describe('Requirement 2.5: Emotion-weighted probability distribution should be applied', () => {
      it('should apply emotion-weighted probability distribution according to fortune value', async () => {
        const fortuneEmotionStats: { [fortuneId: string]: { positive: number; neutral: number; negative: number } } = {};
        
        // Collect comprehensive data across all fortune types
        for (let i = 0; i < 200; i++) {
          const response = await callOmikujiDraw({
            omikujiType: 'engineer-fortune',
            sessionId: `req2-5-test-${i}`
          });

          expect(response.status).toBe(200);
          const result = response.body;
          if (result.success) {
            const fortuneId = result.result.fortune.id;
            if (!fortuneEmotionStats[fortuneId]) {
              fortuneEmotionStats[fortuneId] = { positive: 0, neutral: 0, negative: 0 };
            }

            const categories = result.result.omikujiResult.categories.items;
            categories.forEach((category: any) => {
              fortuneEmotionStats[fortuneId][category.emotionTone]++;
            });
          }
        }

        // Verify that better fortunes have higher positive ratios
        const fortuneOrder = ['daikichi', 'chukichi', 'kichi', 'shokichi', 'suekichi', 'kyo', 'daikyo'];
        const positiveRatios: { [fortuneId: string]: number } = {};

        Object.entries(fortuneEmotionStats).forEach(([fortuneId, emotions]) => {
          const total = emotions.positive + emotions.neutral + emotions.negative;
          if (total > 0) {
            positiveRatios[fortuneId] = emotions.positive / total;
          }
        });

        // Verify weighted distribution: better fortunes should have higher positive ratios
        if (positiveRatios.daikichi && positiveRatios.daikyo) {
          expect(positiveRatios.daikichi).toBeGreaterThan(positiveRatios.daikyo, 
            'Daikichi should have higher positive ratio than daikyo');
        }

        if (positiveRatios.chukichi && positiveRatios.kyo) {
          expect(positiveRatios.chukichi).toBeGreaterThan(positiveRatios.kyo, 
            'Chukichi should have higher positive ratio than kyo');
        }

        // Log for debugging
        console.log('Emotion distribution by fortune:', positiveRatios);
      });
    });
  });
});