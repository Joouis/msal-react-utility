'use client';

import React from 'react';
import { useEventCallback } from './useEventCallback';
import { useFetchWithToken } from './useFetchWithToken';
import { RequestInProgressError } from '../inteface';
import { getResponseData } from '../utilities/getResponseData';
import type { IGetTokenOptions } from '../inteface';

export const useFetchWithStatus = <T>(
  input: string | URL | globalThis.Request,
  init?: RequestInit,
) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const isLoadingRef = React.useRef<boolean>(false);
  const fetchWithToken = useFetchWithToken();

  const _fetch: (
    payload?: RequestInit,
    getTokenOpts?: IGetTokenOptions,
  ) => Promise<T> = useEventCallback(async (payload, getTokenOpts) => {
    if (isLoadingRef.current) {
      throw new RequestInProgressError();
    }

    setIsLoading(true);
    isLoadingRef.current = true;

    const requestInit = !init && !payload ? undefined : { ...init, ...payload };
    try {
      const response = await fetchWithToken(input, requestInit, getTokenOpts);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`, {
          cause: response,
        });
      }

      const data = await getResponseData<T>(response);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  });

  return {
    isLoading,
    _fetch,
  };
};
