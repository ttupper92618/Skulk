/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOLGEE_API_URL?: string;
  readonly VITE_TOLGEE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
