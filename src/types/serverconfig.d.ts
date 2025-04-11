declare global {
  interface ServerConfig {
    port: string | number;
    streamUrl: string;
    refreshInterval: number;
    headers: Record<string, string>;
  }
}

export {};
