/**
 * Streaming SSE chat handler
 *
 * Uses fetch() + ReadableStream to consume the OpenAI-compatible streaming
 * API. This is a port of the identical logic from the original Svelte store.
 */

import type {
  ChatCompletionRequest,
  ImageGenerationRequest,
  ImageEditRequest,
} from './types';

export interface StreamingCallbacks {
  onToken: (token: string) => void;
  onTtft: (ms: number) => void;
  onComplete: (tps: number) => void;
  onError: (error: Error) => void;
  onPrefillStart?: () => void;
  onPrefillEnd?: () => void;
  onHeatmapChunk?: (tokens: Array<{ token: string; logprob: number }>) => void;
}

/**
 * Sends a streaming chat completion request and calls back as tokens arrive.
 * Returns an AbortController so the caller can cancel mid-stream.
 */
export function streamChatCompletion(
  request: ChatCompletionRequest,
  callbacks: StreamingCallbacks,
): AbortController {
  const controller = new AbortController();
  const startTime = performance.now();
  let firstTokenTime: number | null = null;
  let tokenCount = 0;

  void (async () => {
    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            const elapsedSec = (performance.now() - startTime) / 1000;
            const tps = elapsedSec > 0 ? tokenCount / elapsedSec : 0;
            callbacks.onComplete(tps);
            return;
          }

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{
                delta?: { content?: string };
                finish_reason?: string | null;
              }>;
              // Extended fields for prefill and heatmap
              prefill?: boolean;
              heatmap?: Array<{ token: string; logprob: number }>;
            };

            if (parsed.prefill === true) {
              callbacks.onPrefillStart?.();
              continue;
            }
            if (parsed.prefill === false) {
              callbacks.onPrefillEnd?.();
              continue;
            }
            if (parsed.heatmap) {
              callbacks.onHeatmapChunk?.(parsed.heatmap);
              continue;
            }

            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              if (firstTokenTime === null) {
                firstTokenTime = performance.now();
                callbacks.onTtft(firstTokenTime - startTime);
              }
              tokenCount++;
              callbacks.onToken(delta);
            }
          } catch {
            // Malformed SSE chunk — skip it
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  return controller;
}

/**
 * Sends an image generation request and returns the image URL.
 */
export async function generateImage(
  request: ImageGenerationRequest,
): Promise<string> {
  const response = await fetch('/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };

  const result = data.data?.[0];
  if (!result) throw new Error('No image data in response');

  if (result.url) return result.url;
  if (result.b64_json) return `data:image/png;base64,${result.b64_json}`;

  throw new Error('Unexpected image response format');
}

/**
 * Sends an image edit request and returns the edited image URL.
 */
export async function editImage(request: ImageEditRequest): Promise<string> {
  const response = await fetch('/v1/images/edits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Image edit failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };

  const result = data.data?.[0];
  if (!result) throw new Error('No image data in response');

  if (result.url) return result.url;
  if (result.b64_json) return `data:image/png;base64,${result.b64_json}`;

  throw new Error('Unexpected image response format');
}
