import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import authMiddleware from './middlewares/auth.middleware';
import errorHandler from './middlewares/errorHandler';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Public routes (no auth required)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRoutes);

// Protected routes (auth required)
app.use('/order', authMiddleware, orderRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
