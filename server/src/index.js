import './config/env.js'; // Validate env vars first
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import clientRoutes from './routes/clients.routes.js';
import sessionRoutes from './routes/sessions.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import reportRoutes from './routes/reports.routes.js';

const app = express();

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

const PORT = parseInt(env.PORT, 10);
app.listen(PORT, () => {
  console.log(`[Server] Niyam AI CA Tool API running on port ${PORT} (${env.NODE_ENV})`);
});

export default app;
