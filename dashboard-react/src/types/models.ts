export interface ModelInfo {
  id: string;
  name?: string;
  storage_size_megabytes?: number;
  base_model?: string;
  quantization?: string;
  supports_tensor?: boolean;
  capabilities?: string[];
  family?: string;
  is_custom?: boolean;
  tasks?: string[];
  hugging_face_id?: string;
}

export interface ModelGroup {
  id: string;
  name: string;
  capabilities: string[];
  family: string;
  variants: ModelInfo[];
  smallestVariant: ModelInfo;
  hasMultipleVariants: boolean;
}

export interface FilterState {
  capabilities: string[];
  sizeRange: { min: number; max: number } | null;
  downloadedOnly: boolean;
  readyOnly: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  capabilities: [],
  sizeRange: null,
  downloadedOnly: false,
  readyOnly: false,
};

export type ModelFitStatus = 'fits_now' | 'fits_cluster_capacity' | 'too_large';

export interface DownloadAvailability {
  available: boolean;
  nodeNames: string[];
  nodeIds: string[];
}

export interface InstanceStatus {
  status: string;
  statusClass: string;
}

export interface HuggingFaceModel {
  id: string;
  author: string;
  downloads: number;
  likes: number;
  last_modified: string;
  tags: string[];
}

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  speed: number;
  etaMs: number;
  percentage: number;
  completedFiles: number;
  totalFiles: number;
  files: Array<{
    name: string;
    totalBytes: number;
    downloadedBytes: number;
  }>;
}

export interface PlacementPreview {
  model_id: string;
  sharding: 'Pipeline' | 'Tensor';
  instance_meta: 'MlxRing' | 'MlxJaccl';
  instance: unknown | null;
  memory_delta_by_node: Record<string, number> | null;
  error: string | null;
}

/** All known capability tags. */
export const CAPABILITIES = [
  'text',
  'thinking',
  'code',
  'vision',
  'image_gen',
  'image_edit',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** Size range presets for the filter popover. */
export const SIZE_RANGES = [
  { label: '< 10 GB', min: 0, max: 10 * 1024 },
  { label: '10–50 GB', min: 10 * 1024, max: 50 * 1024 },
  { label: '50–200 GB', min: 50 * 1024, max: 200 * 1024 },
  { label: '> 200 GB', min: 200 * 1024, max: Infinity },
] as const;

export type PickerMode = 'launch' | 'store-download';

/**
 * Group ModelInfo[] by base_model (or model id if no base_model).
 * Variants sorted by size ascending; smallest tracked for group display.
 */
export function groupModels(models: ModelInfo[]): ModelGroup[] {
  const map = new Map<string, ModelInfo[]>();
  for (const m of models) {
    const key = m.base_model || m.id;
    const existing = map.get(key);
    if (existing) existing.push(m);
    else map.set(key, [m]);
  }

  return Array.from(map.entries()).map(([key, variants]) => {
    const sorted = [...variants].sort(
      (a, b) => (a.storage_size_megabytes ?? 0) - (b.storage_size_megabytes ?? 0),
    );
    const first = sorted[0];
    return {
      id: key,
      name: first.name ?? first.id,
      capabilities: first.capabilities ?? [],
      family: first.family ?? '',
      variants: sorted,
      smallestVariant: first,
      hasMultipleVariants: sorted.length > 1,
    };
  });
}
