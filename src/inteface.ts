import type { SilentRequest } from '@azure/msal-browser';

export enum TokenType {
  id = 'id',
  access = 'access',
}

export interface IGetTokenOptions {
  tokenType?: TokenType;
  requestConfigs?: SilentRequest;
}

export type GetToken = (opts?: IGetTokenOptions) => Promise<string | undefined>;

export class RequestInProgressError extends Error {
  constructor() {
    super('Request is in progress!');
  }
}
