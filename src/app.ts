import express from 'express';
import cors from 'cors';
import { OmikujiDrawService } from './domain/services/OmikujiDrawService';
import { JsonFortuneRepository } from './infrastructure/repositories/json/FortuneRepository';
import { JsonOmikujiResultRepository } from './infrastructure/repositories/json/JsonOmikujiResultRepository';
import type { OmikujiDrawRequest, OmikujiDrawResponse, OmikujiType } from './types/omikuji';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const fortuneRepository = new JsonFortuneRepository();
const resultRepository = new JsonOmikujiResultRepository();
const drawService = new OmikujiDrawService(fortuneRepository, resultRepository);

// Valid omikuji types
const VALID_OMIKUJI_TYPES: OmikujiType[] = [
  'engineer-fortune',
  'tech-selection',
  'debug-fortune',
  'code-review-fortune',
  'deploy-fortune'
];

// Validation helpers
function validateOmikujiType(type: string): type is OmikujiType {
  return VALID_OMIKUJI_TYPES.includes(type as OmikujiType);
}

function validateMonetaryAmount(amount: any): number {
  const parsed = Number(amount);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error('Invalid monetary amount');
  }
  return parsed;
}

// API Routes
app.post('/api/omikuji/draw', async (req, res) => {
  try {
    const { omikujiType, monetaryAmount, typeId, saisenLevel } = req.body;
    
    // Support both new and legacy request formats
    const type = omikujiType || typeId;
    const amount = monetaryAmount !== undefined ? monetaryAmount : (saisenLevel || 0);

    // Validate input
    if (!type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Omikuji type is required'
        }
      });
    }

    if (!validateOmikujiType(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid omikuji type. Valid types: ${VALID_OMIKUJI_TYPES.join(', ')}`
        }
      });
    }

    let validatedAmount: number;
    try {
      validatedAmount = validateMonetaryAmount(amount);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Monetary amount must be a non-negative number'
        }
      });
    }

    // Draw omikuji
    const result = await drawService.draw(type, validatedAmount);

    if (result.isFailure) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DRAW_FAILED',
          message: result.error.message
        }
      });
    }

    // Prepare response
    const response: OmikujiDrawResponse = {
      success: true,
      result: {
        fortune: result.value.fortune,
        omikujiResult: result.value.omikujiResult
      }
    };

    // Legacy format for existing tests
    if (typeId !== undefined) {
      return res.json({
        success: true,
        data: {
          id: result.value.omikujiResult.id.value,
          omikujiType: type,
          fortune: result.value.fortune,
          result: result.value.omikujiResult
        }
      });
    }

    res.json(response);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// Fortune types endpoint
app.get('/api/fortune/types', async (req, res) => {
  try {
    const fortunes = await fortuneRepository.findAll();
    res.json({
      success: true,
      data: fortunes
    });
  } catch (error) {
    console.error('Fortune types error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to load fortune types'
      }
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { app };