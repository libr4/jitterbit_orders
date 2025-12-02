import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import errorMiddleware from './middlewares/error.middleware';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/order', orderRoutes);

app.use(errorMiddleware);

export default app;
