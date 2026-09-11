import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export interface ErrorEnvelope {
  error: string;
  message: string;
  statusCode: number;
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  error: string,
  message: string,
): void {
  const body: ErrorEnvelope = { error, message, statusCode };
  void reply.status(statusCode).send(body);
}

export function badRequest(reply: FastifyReply, message: string): void {
  sendError(reply, 400, 'Bad Request', message);
}

export function notFound(reply: FastifyReply, message: string): void {
  sendError(reply, 404, 'Not Found', message);
}

export function tooManyRequests(reply: FastifyReply, message: string): void {
  sendError(reply, 429, 'Too Many Requests', message);
}

export function unauthorized(reply: FastifyReply, message: string): void {
  sendError(reply, 401, 'Unauthorized', message);
}

/** Maps a Zod validation failure to the consistent error envelope. */
export function zodMessage(err: ZodError): string {
  return err.issues
    .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
    .join('; ');
}
