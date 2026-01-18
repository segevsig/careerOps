import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import applicationsRoutes from './routes/applications';
import generateCoverLetter from './routes/coverLetter';


const app: Application = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'careerops-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/cover-letter',generateCoverLetter);



export default app;
