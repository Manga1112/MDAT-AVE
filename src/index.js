import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import logger from './config/logger.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import candidatesRouter from './routes/candidates.js';
import screeningsRouter from './routes/screenings.js';
import jobsRouter from './routes/jobs.js';
import ticketsRouter from './routes/tickets.js';
import approvalsRouter from './routes/approvals.js';
import dashboardRouter from './routes/dashboards.js';
import { env } from './config/env.js';
import hrScreenerRouter from './routes/hrScreener.js';
import hrApplicationsRouter from './routes/hrApplications.js';
import offersRouter from './routes/offers.js';
import applicationsRouter from './routes/applications.js';
import projectsRouter from './routes/projects.js';

dotenv.config();
// nodemon restart trigger: env updated for remote MongoDB

const app = express();

// Security & parsing
app.use(helmet());
// CORS with allowed origins
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser tools
    if (!env.corsAllowedOrigins.length || env.corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(limiter);

// Logging
app.use(morgan('tiny'));

// DB
await connectDB();

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/candidates', candidatesRouter);
app.use('/screenings', screeningsRouter);
app.use('/jobs', jobsRouter);
app.use('/tickets', ticketsRouter);
app.use('/approvals', approvalsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/hr/screener', hrScreenerRouter);
app.use('/hr/applications', hrApplicationsRouter);
app.use('/offers', offersRouter);
app.use('/applications', applicationsRouter);
app.use('/projects', projectsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
