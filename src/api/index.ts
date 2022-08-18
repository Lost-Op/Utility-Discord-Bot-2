import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { WAKE_INTERVAL } from 'src/constants';
import { log, error } from 'src/logging';

// Routers
import authRouter from './routes/auth';
import remindersRouter from './routes/reminders';
import guildsRouter from './routes/guilds';

dotenv.config();

function preventSleep() {
  const host = process.env.PING_HOST;
  if (!host) return;
  log('Pinging', host, 'on timeout', WAKE_INTERVAL);
  setTimeout(async () => {
    try {
      await axios.get(host);
      log('Successful ping!');
    } catch (err) {
      error(err);
    }
    preventSleep();
  }, WAKE_INTERVAL);
}

const app = express();

export function initApi(): void {
  app.get('/', (req, res) => res.send('Healthy!'));
  app.use(cors({
    credentials: true,
    origin: process.env.ENVIRONMENT === 'production'
      ? [
        /^https:\/\/utilitydiscordbot\.com$/,
      ] : [
        /^https?:\/\/localhost(:\d+)?$/,
      ],
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use('/reminders', remindersRouter);
  app.use('/guilds', guildsRouter);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(port, () => {
    log('Listening on port', port);
    preventSleep();
  });
}
