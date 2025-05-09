'use client';

import React from 'react';
import { useMsal } from '@azure/msal-react';
import { msalConfig } from '../globalConfig';

export const useAutoSetActiveAccount = () => {
  const { instance, accounts } = useMsal();

  React.useEffect(() => {
    const activeAccount = instance.getActiveAccount();
    const defaultTenantId = msalConfig.getDefaultTenantId();
    if (defaultTenantId && activeAccount?.tenantId !== defaultTenantId) {
      const validAccount = accounts.find((a) => a.tenantId === defaultTenantId);
      if (validAccount) {
        instance.setActiveAccount(validAccount);
      }
    } else if (!activeAccount && accounts[0]) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [instance, accounts]);
};
