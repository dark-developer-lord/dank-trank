import { log } from './logger.js';

export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;

export function handleError(err: unknown): never {
  if (err instanceof Error) {
    log.error(err.message);
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
  } else {
    log.error('An unexpected error occurred.');
  }
  process.exit(EXIT_FAILURE);
}

export function exitSuccess(): never {
  process.exit(EXIT_SUCCESS);
}
