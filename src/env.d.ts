/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_TOKBOX_API_KEY: string;
  readonly VITE_TOKBOX_TOKEN: string;
  readonly VITE_DAILY_API_KEY: string;
  readonly VITE_TOKBOX_SESSION_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
