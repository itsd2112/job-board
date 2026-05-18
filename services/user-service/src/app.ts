import express, { Application, Request, Response } from 'express';

const app: Application = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('User Service is running!');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' , service: 'User Service'});
});

export default app;