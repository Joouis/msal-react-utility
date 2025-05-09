import type { SilentRequest } from '@azure/msal-browser';

interface GlobalConfig {
  defaultTenantId?: string;
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

  public setDefaultTenantId(tenantId: string): void {
    this.config.defaultTenantId = tenantId;
  }

  public getDefaultTenantId(): string | undefined {
    return this.config.defaultTenantId;
  }

  public reset(): void {
    this.config = {};
  }
}

export const msalConfig = MSALConfigSingleton.getInstance();
