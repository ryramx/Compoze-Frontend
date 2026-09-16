/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API do Compoze (backend FastAPI). */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
