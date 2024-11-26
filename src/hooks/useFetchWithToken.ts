import type { SilentRequest } from '@azure/msal-browser';
import React from 'react';
import { useGetToken } from './useGetToken';

export const useFetchWithToken = (tokenRequestConfigs?: SilentRequest) => {
  const getToken = useGetToken(tokenRequestConfigs);

  return React.useCallback(
    async (input: string | URL | globalThis.Request, init?: RequestInit) => {
      try {
        const token = await getToken();
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
