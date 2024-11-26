'use client';

import React from 'react';
import { useMsal } from '@azure/msal-react';
import type { SilentRequest } from '@azure/msal-browser';
import {
  InteractionRequiredAuthError,
  BrowserAuthError,
  BrowserAuthErrorCodes,
  InteractionStatus,
} from '@azure/msal-browser';
import { useEventCallback } from './useEventCallback';
import { sleep } from '../utilities/sleep';

export interface IGetTokenOptions {
  tokenType?: 'id' | 'access';
  requestConfigs?: SilentRequest;
}
type GetToken = (opts?: IGetTokenOptions) => Promise<string | undefined>;

// User should have logged in before calling this hook
export const useGetToken = (defaultRequestConfigs?: SilentRequest) => {
  const { instance, inProgress, accounts } = useMsal();
  const inProgressRef = React.useRef(inProgress);
  const account = accounts[0];

  React.useEffect(() => {
    inProgressRef.current = inProgress;
  }, [inProgress]);

  const getToken: GetToken = useEventCallback(
    async (opts) => {
      const { tokenType = 'access', requestConfigs } = opts || {};
      while (inProgressRef.current !== InteractionStatus.None) {
        await sleep(100);
      }

      const configs = {
        scopes: ['User.Read'],
        prompt: 'select_account',
        ...defaultRequestConfigs,
        ...requestConfigs,
      };
      try {
        const activeAccount = instance.getActiveAccount() || account;
        if (!activeAccount) {
          await instance.loginRedirect();
        }

        const resp = await instance.acquireTokenSilent({
          account: activeAccount,
          ...configs,
        });

        if (tokenType === 'access') {
          return resp.accessToken;
        }

        const idTokenExp = (resp.idTokenClaims as any).exp as number;
        if (resp.fromCache && idTokenExp * 1000 - Date.now() < 2 * 60 * 1000) {
          return await getToken({
            tokenType: 'id',
            requestConfigs: { ...configs, forceRefresh: true },
          });
        }

        // Note: not the best practice to use idToken instead of accessToken, however it can work for both 1P and 3P accounts
        return resp.idToken;
      } catch (error) {
        console.error(`[getToken] ${error}`);
        if (error instanceof InteractionRequiredAuthError) {
          await instance.acquireTokenRedirect(configs);
        } else if (
          error instanceof BrowserAuthError &&
          error.errorCode === BrowserAuthErrorCodes.interactionInProgress
        ) {
          // All contexts will get lost after redirect, so just keep loading here
          await sleep(120_000);
        } else {
          throw error;
        }
      }
    },
  );

  return getToken;
};
