declare global {
  interface ServerConfig {
    port: string | number;
    refreshInterval: number;
    headers: Record<string, string>;
  }
}

export {};
