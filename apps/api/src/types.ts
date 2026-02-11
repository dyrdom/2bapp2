import { Request } from 'express';

export interface AuthPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}
