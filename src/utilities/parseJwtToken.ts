export const parseJwtToken = (token: string) => {
  if (!token) {
    throw new Error('Token is empty');
  }

  const base64Url = token.split('.')[1];
  if (!base64Url) {
    throw new Error('Invalid token format');
  }

  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
      .join('')
  );

  return JSON.parse(jsonPayload);
}