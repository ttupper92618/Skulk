/**
 * API Client
 *
 * Typed fetch wrappers for all exo backend endpoints.
 * All requests are relative so they work with both the Vite dev proxy
 * and when served statically from the exo server.
 */

import type {
  StateResponse,
  ModelStoreConfig,
  PlacementPreview,
  TraceEntry,
  HuggingFaceModel,
} from './types';

// ─── Base helpers ──────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const response = await fetch(path, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`DELETE ${path} failed: ${response.status} ${response.statusText}`);
  }
}

// ─── State endpoint ────────────────────────────────────────────────────────────

export async function fetchState(): Promise<StateResponse> {
  return get<StateResponse>('/state');
}

// ─── Model downloads ───────────────────────────────────────────────────────────

export async function startDownload(modelId: string): Promise<void> {
  await post('/download/start', { model_id: modelId });
}

export async function cancelDownload(modelId: string): Promise<void> {
  await post('/download/cancel', { model_id: modelId });
}

// ─── Placement previews ────────────────────────────────────────────────────────

export async function fetchPlacementPreview(
  modelId: string,
): Promise<PlacementPreview> {
  return get<PlacementPreview>(`/models/${encodeURIComponent(modelId)}/placement`);
}

// ─── Config / Store ────────────────────────────────────────────────────────────

export async function fetchConfig(): Promise<ModelStoreConfig> {
  return get<ModelStoreConfig>('/config');
}

export async function saveConfig(config: ModelStoreConfig): Promise<void> {
  await post('/config', config);
}

export async function fetchStore(): Promise<ModelStoreConfig> {
  return get<ModelStoreConfig>('/store');
}

export async function addModelStore(path: string): Promise<void> {
  await post('/store/add', { path });
}

export async function removeModelStore(path: string): Promise<void> {
  await post('/store/remove', { path });
}

// ─── Traces ────────────────────────────────────────────────────────────────────

export async function fetchTraces(): Promise<TraceEntry[]> {
  return get<TraceEntry[]>('/v1/traces');
}

export async function deleteTrace(taskId: string): Promise<void> {
  await del(`/v1/traces/${encodeURIComponent(taskId)}`);
}

export async function deleteAllTraces(): Promise<void> {
  await del('/v1/traces');
}

export async function fetchTraceData(taskId: string): Promise<unknown> {
  return get<unknown>(`/v1/traces/${encodeURIComponent(taskId)}`);
}

// ─── Node identity ─────────────────────────────────────────────────────────────

export async function fetchNodeInfo(): Promise<unknown> {
  return get<unknown>('/node');
}

// ─── HuggingFace search (proxied through exo backend) ─────────────────────────

export async function searchHuggingFace(query: string): Promise<HuggingFaceModel[]> {
  return get<HuggingFaceModel[]>(
    `/models/search?q=${encodeURIComponent(query)}`,
  );
}
