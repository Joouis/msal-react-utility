import type { SilentRequest } from '@azure/msal-browser';

interface GlobalConfig {
  defaultSilentRequest?: SilentRequest;
}

class MSALConfigSingleton {
  private static instance: MSALConfigSingleton;
  private config: GlobalConfig = {};

  private constructor() {}

  public static getInstance(): MSALConfigSingleton {
    if (!MSALConfigSingleton.instance) {
      MSALConfigSingleton.instance = new MSALConfigSingleton();
    }
    return MSALConfigSingleton.instance;
  }

  public setDefaultSilentRequest(config: SilentRequest): void {
    this.config.defaultSilentRequest = config;
  }

  public getDefaultSilentRequest(): SilentRequest | undefined {
    return this.config.defaultSilentRequest;
  }

  public reset(): void {
    this.config = {};
  }
}

export const msalConfig = MSALConfigSingleton.getInstance();

export const setDefaultSilentRequest = (config: SilentRequest): void => {
  msalConfig.setDefaultSilentRequest(config);
};

export const getDefaultSilentRequest = (): SilentRequest | undefined => {
  return msalConfig.getDefaultSilentRequest();
};
