/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_RACE_API_URL: string;
  readonly VITE_ASSETS_URL: string;
  // more env variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
