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
import requestLogger from './middlewares/requestLogger';

dotenv.config();

const app = express();

app.use(helmet());
// Allow CORS with credentials so the Swagger UI (or other frontends)
// can send cookies or Authorization headers when needed. `origin: true`
// reflects the request origin instead of using a wildcard which disallows
// sending credentials.
app.use(
	cors({
		origin: true,
		credentials: true
	})
);
app.use(express.json());
app.use(cookieParser());

// Request lifecycle logging (adds requestId to req and response header)
app.use(requestLogger);

// Public routes (no auth required)
// Configure Swagger UI to include credentials in requests so "Try it out"
// will send httpOnly cookies (if present) and allow testing cookie-based auth.
app.use(
	'/docs',
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, {
		explorer: true,
		swaggerOptions: {
			// Ensure browser includes cookies when issuing requests from the UI
			requestInterceptor: (req: any) => {
				req.credentials = 'include';
				return req;
			}
		}
	})
);
app.use('/auth', authRoutes);

// Protected routes (auth required)
app.use('/order', authMiddleware, orderRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
