import express from 'express';
import cors from 'cors';
import { reviewRouter } from './routes/review.js';
import { getProviderInfo, getDefaultModel } from './services/reviewService.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', reviewRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    provider: getProviderInfo(),
    defaultModel: getDefaultModel(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Review Server running on http://0.0.0.0:${PORT}`);
  console.log(`LLM Provider: ${getProviderInfo()}`);
});
