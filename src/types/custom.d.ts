import { Response } from "express";

declare global {
  interface Client {
    id: number;
    response: Response<any, Record<string, any>>;
  }
}

export {};
