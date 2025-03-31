export const getResponseData = async <T>(response: Response): Promise<T> => {
  let data: T;
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType.includes('text/')) {
    data = (await response.text()) as unknown as T;
  } else if (contentType.includes('application/octet-stream')) {
    data = (await response.arrayBuffer()) as unknown as T;
  } else if (
    contentType.includes('application/xml') ||
    contentType.includes('text/xml')
  ) {
    data = (await response.text()) as unknown as T;
  } else if (
    contentType.startsWith('image/') ||
    contentType.startsWith('video/') ||
    contentType.startsWith('audio/') ||
    contentType.includes('application/pdf')
  ) {
    data = (await response.blob()) as unknown as T;
  } else {
    // Try JSON first, fall back to text
    try {
      data = await response.json();
    } catch (e) {
      data = (await response.text()) as unknown as T;
    }
  }
  return data;
};
