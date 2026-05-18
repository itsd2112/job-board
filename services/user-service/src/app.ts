import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app: Application = express();

// Security
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());

// Rate limiting
// Limit to 100 requests per 15 minutes per IP
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
}));


app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' , service: 'User Service'});
});

export default app;