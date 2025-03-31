'use client';

import type { SilentRequest } from '@azure/msal-browser';
import { useCallback } from 'react';
import { useGetToken } from './useGetToken';
import type { IGetTokenOptions } from '../inteface';

export const useFetchWithToken = (tokenRequestConfigs?: SilentRequest) => {
  const getToken = useGetToken(tokenRequestConfigs);

  return useCallback(
    async (
      input: string | URL | globalThis.Request,
      init?: RequestInit,
      getTokenOpts?: IGetTokenOptions,
    ) => {
      try {
        const token = await getToken(getTokenOpts);
        if (!token) {
          throw new Error('Failed to fetch token');
        }

        return fetch(input, {
          ...init,
          headers: {
            Authorization: `Bearer ${token}`,
            // User can override token
            ...init?.headers,
          },
        });
      } catch (error) {
        console.error(`[useFetchWithToken] ${error}`);
        const { name, message } = error as Error;
        return new Response(name, {
          status: 401,
          statusText: message,
        });
      }
    },
    [getToken],
  );
};
