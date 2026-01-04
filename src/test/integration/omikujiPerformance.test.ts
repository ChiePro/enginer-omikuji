import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import type { OmikujiDrawRequest, OmikujiDrawResponse } from '../../types/omikuji';
import { OmikujiDrawService } from '../../domain/services/OmikujiDrawService';
import { JsonFortuneRepository } from '../../infrastructure/repositories/json/FortuneRepository';
import { JsonOmikujiResultRepository } from '../../infrastructure/repositories/json/JsonOmikujiResultRepository';

describe('Omikuji Performance Tests', () => {
  let drawService: OmikujiDrawService;
  
  beforeAll(() => {
    drawService = new OmikujiDrawService(
      new JsonFortuneRepository(),
      new JsonOmikujiResultRepository()
    );
  });

  describe('1000 consecutive draws performance', () => {
    it('should handle 1000 draws within reasonable time', async () => {
      const startTime = Date.now();
      const drawCount = 1000;
      const results: OmikujiDrawResponse[] = [];

      // Perform 1000 draws in batches to avoid overwhelming the API
      const batchSize = 50;
      const batches = Math.ceil(drawCount / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = Array.from({ length: Math.min(batchSize, drawCount - batch * batchSize) }, () =>
          request(app)
            .post('/api/omikuji/draw')
            .send({
              omikujiType: 'engineer-fortune',
              monetaryAmount: 100
            })
        );

        const batchResponses = await Promise.all(batchPromises);
        results.push(...batchResponses.map(r => r.body));
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTimePerDraw = totalTime / drawCount;

      console.log(`🔍 Performance Metrics:`);
      console.log(`  Total draws: ${drawCount}`);
      console.log(`  Total time: ${totalTime}ms`);
      console.log(`  Average time per draw: ${averageTimePerDraw.toFixed(2)}ms`);
      console.log(`  Draws per second: ${(1000 / averageTimePerDraw).toFixed(2)}`);

      // Performance expectations
      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds
      expect(averageTimePerDraw).toBeLessThan(100); // Average should be under 100ms per draw
      
      // Verify all draws succeeded
      const successfulDraws = results.filter(r => r.success);
      expect(successfulDraws.length).toBe(drawCount);
      
      // Verify result quality
      successfulDraws.forEach((result, index) => {
        expect(result.result).toBeDefined();
        expect(result.result?.fortune).toBeDefined();
        expect(result.result?.omikujiResult).toBeDefined();
      });
    });

    it('should maintain consistent response times across draws', async () => {
      const drawCount = 100;
      const responseTimes: number[] = [];

      for (let i = 0; i < drawCount; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/omikuji/draw')
          .send({
            omikujiType: 'engineer-fortune',
            monetaryAmount: 100
          });

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / drawCount;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / drawCount;
      const standardDeviation = Math.sqrt(variance);

      console.log(`📊 Response Time Statistics:`);
      console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min: ${minResponseTime}ms`);
      console.log(`  Max: ${maxResponseTime}ms`);
      console.log(`  Standard Deviation: ${standardDeviation.toFixed(2)}ms`);

      // Performance expectations
      expect(avgResponseTime).toBeLessThan(200); // Average should be under 200ms
      expect(maxResponseTime).toBeLessThan(1000); // No single request should take over 1 second
      expect(standardDeviation).toBeLessThan(avgResponseTime); // Reasonable consistency
    });
  });

  describe('Probability distribution accuracy', () => {
    it('should maintain accurate fortune distribution over 1000 draws', async () => {
      const drawCount = 1000;
      const fortuneStats: Record<string, number> = {};

      // Perform draws via service for faster execution
      for (let i = 0; i < drawCount; i++) {
        const result = await drawService.draw('engineer-fortune', 100);
        if (result.isSuccess && result.value.fortune) {
          const fortuneId = result.value.fortune.id;
          fortuneStats[fortuneId] = (fortuneStats[fortuneId] || 0) + 1;
        }
      }

      const totalDraws = Object.values(fortuneStats).reduce((sum, count) => sum + count, 0);
      expect(totalDraws).toBe(drawCount);

      console.log(`🎯 Fortune Distribution (${drawCount} draws):`);
      Object.entries(fortuneStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([fortune, count]) => {
          const percentage = (count / drawCount * 100).toFixed(2);
          console.log(`  ${fortune}: ${count} (${percentage}%)`);
        });

      // Check that we got multiple fortune types
      expect(Object.keys(fortuneStats).length).toBeGreaterThanOrEqual(3);
      
      // Check that no single fortune dominates too much (should be somewhat distributed)
      const maxPercentage = Math.max(...Object.values(fortuneStats)) / drawCount;
      expect(maxPercentage).toBeLessThan(0.6); // No single fortune should be more than 60%
    });

    it('should maintain emotion attribute distribution according to rules', async () => {
      const drawCount = 500;
      const emotionStats: Record<string, { positive: number; neutral: number; negative: number }> = {};

      for (let i = 0; i < drawCount; i++) {
        const result = await drawService.draw('engineer-fortune', 100);
        if (result.isSuccess && result.value.fortune && result.value.omikujiResult) {
          const fortuneId = result.value.fortune.id;
          const emotion = result.value.omikujiResult.emotionAttribute;
          
          if (!emotionStats[fortuneId]) {
            emotionStats[fortuneId] = { positive: 0, neutral: 0, negative: 0 };
          }
          emotionStats[fortuneId][emotion]++;
        }
      }

      console.log(`😊 Emotion Distribution by Fortune:`);
      Object.entries(emotionStats).forEach(([fortuneId, emotions]) => {
        const total = emotions.positive + emotions.neutral + emotions.negative;
        if (total > 10) { // Only show fortunes with significant samples
          const posPercent = (emotions.positive / total * 100).toFixed(1);
          const neuPercent = (emotions.neutral / total * 100).toFixed(1);
          const negPercent = (emotions.negative / total * 100).toFixed(1);
          
          console.log(`  ${fortuneId} (${total} samples):`);
          console.log(`    Positive: ${emotions.positive} (${posPercent}%)`);
          console.log(`    Neutral: ${emotions.neutral} (${neuPercent}%)`);
          console.log(`    Negative: ${emotions.negative} (${negPercent}%)`);
          
          // Verify distribution makes sense for fortune type
          if (fortuneId === 'daikichi') {
            // Great fortune should have high positive ratio
            expect(emotions.positive / total).toBeGreaterThan(0.5);
          } else if (fortuneId === 'kyo' || fortuneId === 'daikyo') {
            // Bad fortune should have high negative ratio
            expect(emotions.negative / total).toBeGreaterThan(0.3);
          }
        }
      });
    });
  });

  describe('Memory usage stability', () => {
    it('should not leak memory during extended use', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await drawService.draw('engineer-fortune', 100);
        await drawService.draw('tech-selection', 100);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`🧠 Memory Usage:`);
      console.log(`  Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Increase: ${memoryIncreaseMB.toFixed(2)}MB`);

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });

  describe('Concurrent user simulation', () => {
    it('should handle multiple concurrent users efficiently', async () => {
      const concurrentUsers = 20;
      const drawsPerUser = 10;
      
      const startTime = Date.now();

      // Simulate concurrent users
      const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const userResults: OmikujiDrawResponse[] = [];
        
        for (let draw = 0; draw < drawsPerUser; draw++) {
          const response = await request(app)
            .post('/api/omikuji/draw')
            .send({
              omikujiType: 'engineer-fortune',
              monetaryAmount: Math.floor(Math.random() * 1000) + 50
            });
          
          userResults.push(response.body);
        }
        
        return { userIndex, results: userResults };
      });

      const userResults = await Promise.all(userPromises);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const totalDraws = concurrentUsers * drawsPerUser;

      console.log(`👥 Concurrent Users Test:`);
      console.log(`  Concurrent users: ${concurrentUsers}`);
      console.log(`  Draws per user: ${drawsPerUser}`);
      console.log(`  Total draws: ${totalDraws}`);
      console.log(`  Total time: ${totalTime}ms`);
      console.log(`  Average time per draw: ${(totalTime / totalDraws).toFixed(2)}ms`);

      // Verify all users got successful results
      userResults.forEach(({ userIndex, results }) => {
        results.forEach((result, drawIndex) => {
          expect(result.success).toBe(true);
          expect(result.result).toBeDefined();
        });
      });

      // Performance should remain good even with concurrent load
      expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Different omikuji types performance comparison', () => {
    it('should perform consistently across all omikuji types', async () => {
      const omikujiTypes = ['engineer-fortune', 'tech-selection', 'debug-fortune', 'code-review-fortune', 'deploy-fortune'];
      const drawsPerType = 50;
      
      const performanceData: Record<string, number[]> = {};

      for (const omikujiType of omikujiTypes) {
        const responseTimes: number[] = [];
        
        for (let i = 0; i < drawsPerType; i++) {
          const startTime = Date.now();
          
          const response = await request(app)
            .post('/api/omikuji/draw')
            .send({
              omikujiType,
              monetaryAmount: 100
            });

          const endTime = Date.now();
          responseTimes.push(endTime - startTime);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
        
        performanceData[omikujiType] = responseTimes;
      }

      console.log(`⚡ Performance by Omikuji Type:`);
      Object.entries(performanceData).forEach(([type, times]) => {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        console.log(`  ${type}:`);
        console.log(`    Average: ${avgTime.toFixed(2)}ms`);
        console.log(`    Range: ${minTime}ms - ${maxTime}ms`);
        
        // Each type should perform reasonably
        expect(avgTime).toBeLessThan(300);
      });
    });
  });
});