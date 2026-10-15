export async function fetchCatalog<T>(
  url: string,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Could not load the university catalogue.");
  return data;
}
