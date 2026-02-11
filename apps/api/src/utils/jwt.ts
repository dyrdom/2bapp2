import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const signAccessToken = (userId: string) =>
  jwt.sign({ userId }, config.jwtAccessSecret, { expiresIn: config.accessTokenTtl });

export const signRefreshToken = (userId: string) =>
  jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: config.refreshTokenTtl });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.jwtAccessSecret) as { userId: string };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
