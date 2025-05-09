# MSAL-REACT-Utility

## Introduction

MSAL-REACT-Utility is a lightweight supplementary package for `@azure/msal-react` that addresses common authentication challenges in React applications using Microsoft Authentication Library (MSAL). While MSAL provides robust authentication capabilities, developers often struggle with complex token management, race conditions, verbose error handling, and repetitive response parsing code, requiring significant boilerplate in their applications.

This package provides a set of custom React hooks and utility functions that abstract these complexities away with zero configuration, automatic token refresh, simplified type-safe APIs, built-in error handling, and integrated loading state management. By handling the authentication plumbing for you, MSAL-REACT-Utility allows you to focus on building your application's core features rather than wrestling with authentication logic.

## Usage

This package provides React hooks and utility functions to simplify authentication and API calls in React applications using MSAL.

### Types and Interfaces

```typescript
// Core types used throughout the library
enum TokenType {
  id = 'id', // For ID tokens
  access = 'access', // For access tokens
}

interface IGetTokenOptions {
  tokenType?: TokenType; // Type of token to request (default: TokenType.access)
  requestConfigs?: SilentRequest; // Optional MSAL request configurations
}

// Error thrown when trying to make a request while another is in progress
class RequestInProgressError extends Error {
  constructor() {
    super('Request is in progress!');
  }
}
```

### Hooks

#### useGetToken

Acquires an access or ID token for authentication.

```typescript
import { useGetToken, TokenType } from '@joouis/msal-react-utility';

const MyComponent = () => {
  // You can provide default request configuration when initializing the hook
  const getToken = useGetToken({
    scopes: ['User.Read', 'Mail.Read'],
    prompt: 'select_account'
  });

  const fetchData = async () => {
    // Get access token (default)
    const accessToken = await getToken();

    // Get ID token specifically
    const idToken = await getToken({
      tokenType: TokenType.id
    });

    // Get token with custom request config
    const customToken = await getToken({
      tokenType: TokenType.access,
      requestConfigs: {
        scopes: ['Files.Read'],
        forceRefresh: true
      }
    });
  };

  return <button onClick={fetchData}>Fetch Data</button>;
};
```

**Input:**

- `defaultRequestConfigs?: SilentRequest` - Default token request configuration from MSAL

**Output:**

- `GetToken` function: `(opts?: IGetTokenOptions) => Promise<string | undefined>`
  - `opts.tokenType`: Specifies whether to return an access token or ID token (default: `TokenType.access`)
  - `opts.requestConfigs`: Override or extend the default request configurations

**Notes:**

- Automatically handles token caching and refresh
- Manages token acquisition during MSAL interaction flows
- Falls back to redirect login flow if no active account is found
- For ID tokens, automatically refreshes if token is close to expiration (< 2 minutes)
- Uses global configuration if available (see Global Configuration section)

#### useFetchWithToken

Makes authenticated API requests with automatic token handling.

```typescript
import { useFetchWithToken } from '@joouis/msal-react-utility';

const MyComponent = () => {
  // Can provide default token request configuration
  const fetchWithToken = useFetchWithToken({
    scopes: ['User.Read', 'api://your-api/access']
  });

  const fetchData = async () => {
    const response = await fetchWithToken(
      'https://api.example.com/data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Authorization header is automatically added
        },
        body: JSON.stringify({ key: 'value' }),
      },
      // Optional token options
      {
        tokenType: TokenType.access,
        requestConfigs: { forceRefresh: true }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(data);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
};
```

**Input:**

- `tokenRequestConfigs?: SilentRequest` - Optional token request configuration

**Output:**

- Fetch function: `(input: string | URL | Request, init?: RequestInit, getTokenOpts?: IGetTokenOptions) => Promise<Response>`
  - Returns a standard Fetch Response with Authorization header automatically added
  - Returns an error Response with status 401 if token acquisition fails

**Notes:**

- Uses global configuration if available (see Global Configuration section)

#### useFetchWithStatus

Makes authenticated API requests with loading state management.

```typescript
import { useFetchWithStatus } from '@joouis/msal-react-utility';

// Specify the expected return type as a generic parameter
interface UserData {
  id: string;
  name: string;
  email: string;
}

const MyComponent = () => {
  // The hook manages loading state internally
  const { isLoading, _fetch } = useFetchWithStatus<UserData>(
    'https://api.example.com/user',
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }
  );

  const fetchUserData = async () => {
    try {
      // Will throw RequestInProgressError if called while already loading
      const userData = await _fetch(
        // Optional request payload to override defaults
        {
          method: 'POST',
          body: JSON.stringify({ filter: 'active' })
        },
        // Optional token options
        { tokenType: TokenType.access }
      );
      console.log(userData.name); // Typed as UserData
    } catch (error) {
      // RequestInProgressError is thrown if a request is already in progress
      if (error instanceof RequestInProgressError) {
        console.log('Request already in progress');
      } else {
        console.error('Failed to fetch user data', error);
      }
    }
  };

  return (
    <div>
      <button onClick={fetchUserData} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch User Data'}
      </button>
    </div>
  );
};
```

**Input:**

- `input: string | URL | Request` - The resource to fetch
- `init?: RequestInit` - Optional fetch configuration

**Output:**

- Object containing:
  - `isLoading: boolean` - Whether a request is currently in progress
  - `_fetch: (payload?: RequestInit, getTokenOpts?: IGetTokenOptions) => Promise<T>` - Function to make authenticated requests

**Notes:**

- Prevents multiple simultaneous requests to the same endpoint
- Manages loading state automatically
- Properly types the response data
- Integrates with `getResponseData` to parse the response based on content type
- Inherits global configuration through its use of `useFetchWithToken`

#### useEventCallback

Creates a callback with stable reference identity across renders.

```typescript
import { useEventCallback } from '@joouis/msal-react-utility';
import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
}

const MyComponent = ({ onSubmit }: { onSubmit: (data: FormData) => void }) => {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' });

  // This callback's identity remains stable even when formData changes
  // This is useful for event handlers that need to reference latest state
  // without causing unnecessary re-renders of child components
  const handleSubmit = useEventCallback(() => {
    console.log('Submitting with data:', formData);
    onSubmit(formData);
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      {/* Form inputs */}
      <button type="submit">Submit</button>
    </form>
  );
};
```

**Input:**

- `handler: T extends (...args: any[]) => any` - Function to stabilize

**Output:**

- Stabilized function with the same signature as the input

**Notes:**

- Useful for callbacks that depend on frequently changing values but shouldn't trigger re-renders
- Solves the issue of creating new function references in render
- Similar to the upcoming React `useEvent` hook

### Utilities

#### getResponseData

Parses response data based on content type.

```typescript
import { getResponseData } from '@joouis/msal-react-utility';

interface ApiResponse {
  results: Array<{ id: number; name: string }>;
  pagination: { next: string | null };
}

const fetchData = async () => {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  // Automatically determines how to parse the response based on Content-Type header
  const data = await getResponseData<ApiResponse>(response);

  // Data is properly typed
  console.log(`Found ${data.results.length} items`);
  return data;
};
```

**Input:**

- `response: Response` - Fetch response object

**Output:**

- `Promise<T>` - Promise resolving to parsed data of type T

**Supported Content Types:**

- `application/json` - Parses as JSON
- `text/*` - Returns as text
- `application/octet-stream` - Returns as ArrayBuffer
- `application/xml` or `text/xml` - Returns as text
- `image/*`, `video/*`, `audio/*`, `application/pdf` - Returns as Blob
- Other types - Attempts JSON parsing first, falls back to text

#### sleep

Delays execution for specified milliseconds.

```typescript
import { sleep } from '@joouis/msal-react-utility';

const delayedOperation = async () => {
  console.log('Starting operation');

  // Wait for 1 second
  await sleep(1000);
  console.log('After 1 second');

  // Can be used in polling scenarios
  let attempts = 0;
  while (attempts < 5) {
    try {
      const result = await checkOperationStatus();
      if (result.status === 'completed') {
        return result.data;
      }
      attempts++;
      await sleep(2000); // Wait 2 seconds between attempts
    } catch (error) {
      console.error('Error checking status', error);
    }
  }
  throw new Error('Operation timed out');
};
```

**Input:**

- `ms: number` - Milliseconds to delay

**Output:**

- `Promise<void>` - Promise that resolves after the delay

### Global Configuration

Provides a way to set global default configurations for token requests and tenant ID that will be used by all hooks in the library. This eliminates the need to pass the same configuration to multiple hooks across your application.

```typescript
import {
  msalConfig,
  useGetToken,
  useFetchWithToken,
} from '@joouis/msal-react-utility';

// Set global default configurations once at the application startup
msalConfig.setDefaultSilentRequest({
  scopes: ['User.Read', 'api://my-app/access'],
  authority: 'https://login.microsoftonline.com/tenant-id',
  forceRefresh: false,
});

msalConfig.setDefaultTenantId('your-tenant-id');

// In components - hooks will use the global configuration automatically
const MyComponent = () => {
  // No need to pass the same config to each hook
  const getToken = useGetToken(); // Uses global config
  const fetchWithToken = useFetchWithToken(); // Uses global config

  // Can still override global config as needed
  const getTokenWithCustomScope = useGetToken({
    scopes: ['Mail.Read'], // Overrides the global scopes
  });

  // Implementation...
};

// Reset all configurations if needed
msalConfig.reset();
```

**Global Configuration Functions:**

- `setDefaultSilentRequest(config: SilentRequest): void` - Sets the default SilentRequest configuration for all token requests
- `getDefaultSilentRequest(): SilentRequest | undefined` - Gets the current global SilentRequest configuration
- `setDefaultTenantId(tenantId: string): void` - Sets the default tenant ID for all requests
- `getDefaultTenantId(): string | undefined` - Gets the current global tenant ID
- `reset(): void` - Resets all global configurations to their default values

**Configuration Hierarchy:**

When using hooks, configurations are applied in the following order of precedence:

1. Default values (`scopes: ['User.Read']`, `prompt: 'select_account'`)
2. Global configuration (set via `setDefaultSilentRequest` and `setDefaultTenantId`)
3. Hook-level configuration (passed directly to hooks like `useGetToken`)
4. Call-level configuration (passed when calling functions like `getToken()`)

**Benefits:**

- Reduces code duplication across components
- Centralizes authentication configuration
- Makes codebase more maintainable
- Allows easy updates to scopes, authorities, or tenant IDs
- No context provider required
- Flexible configuration reset capability

## TODO

- Add a context to register logger.
- Add test scripts.
