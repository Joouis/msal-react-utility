'use client';

import { useRef, useEffect } from 'react';
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
import { parseJwtToken } from '../utilities/parseJwtToken';
import { TokenType, type GetToken } from '../inteface';
import { getDefaultSilentRequest } from '../globalConfig';

// User should have logged in before calling this hook
export const useGetToken = (defaultRequestConfigs?: SilentRequest) => {
  const { instance, inProgress, accounts } = useMsal();
  const inProgressRef = useRef(inProgress);
  const account = accounts[0];

  useEffect(() => {
    inProgressRef.current = inProgress;
  }, [inProgress]);

  const getToken: GetToken = useEventCallback(async (opts) => {
    const { tokenType = TokenType.access, requestConfigs } = opts || {};
    while (inProgressRef.current !== InteractionStatus.None) {
      await sleep(100);
    }

    const configs = {
      scopes: ['User.Read'],
      prompt: 'select_account',
      ...getDefaultSilentRequest(),
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

      if (!resp.idToken) {
        throw new Error('ID token is not available');
      }

      const idTokenExp = parseJwtToken(resp.idToken).exp;
      // Refresh the ID token if it is about to expire in 2 minutes
      if (idTokenExp && idTokenExp * 1000 - Date.now() < 2 * 60 * 1000) {
        return await getToken({
          tokenType: TokenType.id,
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
  });

  return getToken;
};
