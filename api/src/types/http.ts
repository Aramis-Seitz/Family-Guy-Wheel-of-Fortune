export type HttpHeaders = Record<string, string | string[] | undefined>;

export interface HttpRequest {
  method?: string;
  headers?: HttpHeaders;
  body?: unknown;
  query?: unknown;
  params?: Record<string, string | undefined>;
}

export interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): unknown;
  setHeader?(name: string, value: string): void;
}
