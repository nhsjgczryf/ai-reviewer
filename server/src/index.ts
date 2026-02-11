import express from 'express';
import cors from 'cors';
import { reviewRouter } from './routes/review.js';
import { getProviderInfo } from './services/reviewService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', reviewRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', provider: getProviderInfo() });
});

app.listen(PORT, () => {
  console.log(`AI Review Server running on http://localhost:${PORT}`);
  console.log(`LLM Provider: ${getProviderInfo()}`);
});
