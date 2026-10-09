/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Backend del asistente. Sin definir, usa el de producción. */
  readonly VITE_ASSISTANT_URL?: string
  readonly VITE_TEST_EMAIL: string
  readonly VITE_TEST_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
