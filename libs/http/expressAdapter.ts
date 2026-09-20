import express from 'express';
import type { HttpRouter } from './types';

export function createHttpRouter(): HttpRouter {
  return express.Router();
}

export function httpRaw(options?: Parameters<typeof express.raw>[0]): ReturnType<typeof express.raw> {
  return express.raw(options);
}
