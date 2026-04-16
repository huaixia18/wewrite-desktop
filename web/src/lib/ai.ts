/**
 * AI Client — 支持 Anthropic / OpenAI 多提供商 + HTTP 代理
 *
 * 用法：
 *   const client = createAIClient("anthropic")
 *   await client.chat({ messages: [...], stream: true })
 *   await client.chat({ messages: [...], stream: false })
 *
 * 代理配置（环境变量）：
 *   AI_GATEWAY_BASE_URL / AI_GATEWAY_API_KEY — 全厂商统一网关（推荐）
 *   ANTHROPIC_BASE_URL / OPENAI_BASE_URL — 代理或自定义端点
 *   ANTHROPIC_API_KEY   / OPENAI_API_KEY   — API Key
 *
 * 代理格式（主流代理服务通用 OpenAI-compatible API）：
 *   https://your-proxy.com/v1
 *   或 https://api.openai.com（直连）
 */

export type AIProvider = "anthropic" | "openai";
type AITransport = "anthropic" | "openai";

// ─── 配置 ────────────────────────────────────────────────────────────────

interface AIConfig {
  provider: AIProvider;
  transport: AITransport;
  apiKey: string;
  baseUrl: string;
  model: string;
}

function hasUsableApiKey(apiKey: string): boolean {
  return Boolean(apiKey && !apiKey.includes("placeholder"));
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function getSharedGatewayApiKey(): string {
  return (
    process.env.AI_GATEWAY_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.ANTHROPIC_API_KEY ??
    ""
  ).trim();
}

function getSharedGatewayBaseUrl(): string {
  return (
    process.env.AI_GATEWAY_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    process.env.ANTHROPIC_BASE_URL ??
    ""
  ).trim();
}

function isAnthropicNativeBase(baseUrl: string): boolean {
  return /(^https?:\/\/)?api\.anthropic\.com(\/|$)/i.test(baseUrl.trim());
}

function buildOpenAIChatUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  if (/\/v1$/i.test(normalized)) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

function buildAnthropicMessagesUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  if (/\/v1$/i.test(normalized)) return `${normalized}/messages`;
  return `${normalized}/v1/messages`;
}

function getConfig(
  provider: AIProvider,
  userApiKey?: string,
  userBaseUrl?: string
): AIConfig {
  const gatewayApiKey = (process.env.AI_GATEWAY_API_KEY ?? "").trim();
  const providerApiKey = (process.env[`${provider.toUpperCase()}_API_KEY`] ?? "").trim();
  const sharedApiKey = getSharedGatewayApiKey();
  const key =
    (userApiKey ?? "").trim() ||
    (hasUsableApiKey(gatewayApiKey) ? gatewayApiKey : "") ||
    (hasUsableApiKey(providerApiKey) ? providerApiKey : "") ||
    sharedApiKey;

  const gatewayBaseUrl = (process.env.AI_GATEWAY_BASE_URL ?? "").trim();
  const providerBaseUrl = process.env[`${provider.toUpperCase()}_BASE_URL`] ?? "";
  const sharedBaseUrl = getSharedGatewayBaseUrl();

  // 优先级：用户自定义端点 > 环境变量 > 官方默认值
  const baseUrl =
    normalizeBaseUrl(
      userBaseUrl ||
        gatewayBaseUrl ||
        (hasUsableApiKey(providerApiKey) ? providerBaseUrl : "") ||
        sharedBaseUrl ||
        providerBaseUrl
    ) ||
    (provider === "anthropic"
      ? "https://api.anthropic.com"
      : "https://api.openai.com");

  const transport: AITransport =
    provider === "anthropic" && isAnthropicNativeBase(baseUrl)
      ? "anthropic"
      : "openai";

  const envModel = process.env[`${provider.toUpperCase()}_MODEL`]?.trim();
  const defaultModel =
    envModel || (provider === "anthropic" ? "claude-sonnet-4-7-20250514" : "gpt-4o");

  return { provider, transport, apiKey: key, baseUrl, model: defaultModel };
}

// ─── 请求 / 响应类型 ────────────────────────────────────────────────────

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  signal?: AbortSignal;
}

export interface ChatChunk {
  type: "content" | "done" | "error";
  text?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ─── Anthropic API ───────────────────────────────────────────────────────

async function anthropicChat(
  config: AIConfig,
  opts: ChatOptions
): Promise<Response> {
  const { messages, maxTokens = 4096, temperature = 0.7, stream, signal } = opts;
  const systemMessage = messages.find((m) => m.role === "system")?.content;

  const body: Record<string, unknown> = {
    model: opts.model ?? config.model,
    max_tokens: maxTokens,
    temperature,
    messages: messages.filter((m) => m.role !== "system"),
    ...(systemMessage ? { system: systemMessage } : {}),
  };

  if (stream) {
    body.stream = true;
  }

  const url = buildAnthropicMessagesUrl(config.baseUrl);

  return fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      ...(stream ? { "anthropic-beta": "interleaved-thinking-2" } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });
}

// ─── OpenAI API ──────────────────────────────────────────────────────────

async function openaiChat(
  config: AIConfig,
  opts: ChatOptions
): Promise<Response> {
  const { messages, maxTokens = 4096, temperature = 0.7, stream, signal } = opts;

  const body: Record<string, unknown> = {
    model: opts.model ?? config.model,
    max_tokens: maxTokens,
    temperature,
    messages,
    ...(stream ? { stream: true } : {}),
  };

  const url = buildOpenAIChatUrl(config.baseUrl);

  return fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
}

// ─── 统一客户端 ──────────────────────────────────────────────────────────

export class AIClient {
  private config: AIConfig;

  constructor(provider: AIProvider, userApiKey?: string, userBaseUrl?: string) {
    this.config = getConfig(provider, userApiKey, userBaseUrl);
  }

  /**
   * 流式对话 — 返回 ReadableStream<ChatChunk>
   * 适配 Anthropic / OpenAI 两种响应格式
   */
  async *streamChat(opts: ChatOptions): AsyncGenerator<ChatChunk> {
    const res = await this.send(opts, true);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI API Error ${res.status}: ${err}`);
    }

    if (!res.body) {
      throw new Error("AI API returned empty body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      if (this.config.transport === "anthropic") {
        // Anthropic SSE: data: {"type":"content_block_delta","..."
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") {
              yield { type: "done" };
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "content_block_delta") {
                yield { type: "content", text: parsed.delta?.text ?? "" };
              } else if (parsed.type === "message_delta") {
                yield {
                  type: "done",
                  usage: {
                    inputTokens: parsed.usage?.input_tokens ?? 0,
                    outputTokens: parsed.usage?.output_tokens ?? 0,
                  },
                };
              } else if (parsed.type === "error") {
                yield { type: "error", text: parsed.error?.message ?? "Unknown error" };
              }
            } catch {
              // ignore parse error
            }
          }
        }
      } else {
        // OpenAI SSE: data: {"choices":[{"delta":{"content":"..."
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") {
              yield { type: "done" };
              return;
            }

            try {
              const parsed = JSON.parse(data);

              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                yield { type: "content", text: delta };
              }

              if (parsed.choices?.[0]?.finish_reason) {
                yield {
                  type: "done",
                  usage: {
                    inputTokens: parsed.usage?.prompt_tokens ?? 0,
                    outputTokens: parsed.usage?.completion_tokens ?? 0,
                  },
                };
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 非流式对话 — 返回完整文本
   */
  async chat(opts: ChatOptions): Promise<string> {
    const res = await this.send(opts, false);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI API Error ${res.status}: ${err}`);
    }

    const data = await res.json();

    if (this.config.transport === "anthropic") {
      return data.content?.[0]?.text ?? "";
    } else {
      return data.choices?.[0]?.message?.content ?? "";
    }
  }

  private async send(opts: ChatOptions, stream: boolean): Promise<Response> {
    if (this.config.transport === "anthropic") {
      return anthropicChat(this.config, { ...opts, stream });
    } else {
      return openaiChat(this.config, { ...opts, stream });
    }
  }
}

// ─── 快捷工厂函数 ─────────────────────────────────────────────────────────

export function createAIClient(provider: AIProvider, userApiKey?: string, userBaseUrl?: string) {
  return new AIClient(provider, userApiKey, userBaseUrl);
}

// ─── SSE 辅助：将 AsyncGenerator 转为 Next.js Response ─────────────────

export function toSSEStream(
  generator: AsyncGenerator<ChatChunk>
): ReadableStream {
  const encoder = new TextEncoder();
  const encodeSSE = (payload: string) => encoder.encode(`data: ${payload}\n\n`);

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          if (chunk.type === "content" && chunk.text) {
            controller.enqueue(encodeSSE(JSON.stringify({ type: "content", text: chunk.text })));
          } else if (chunk.type === "done") {
            controller.enqueue(encodeSSE(JSON.stringify({ type: "done" })));
            controller.enqueue(encodeSSE("[DONE]"));
          } else if (chunk.type === "error") {
            controller.enqueue(encodeSSE(JSON.stringify({ type: "error", text: chunk.text })));
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}
