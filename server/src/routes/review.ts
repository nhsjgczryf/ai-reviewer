import { Router } from 'express';
import type { Request, Response } from 'express';
import { performReview } from '../services/reviewService.js';

export const reviewRouter = Router();

reviewRouter.post('/review', async (req: Request, res: Response) => {
  try {
    const { code, language, config } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ message: 'Missing or invalid "code" field' });
      return;
    }

    const result = await performReview(code, language || 'javascript', config || {});
    res.json(result);
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({
      message: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});
