import express from 'express';
import cors from 'cors';
import { reviewRouter } from './routes/review.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', reviewRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`AI Review Server running on http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.ANTHROPIC_API_KEY ? 'LLM' : 'Mock'}`);
});
