export class HttpError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  const text = await res.text();

  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
        ? data.message
        : `请求失败（${res.status}）`;
    throw new HttpError(message, res.status);
  }

  return data as T;
}
