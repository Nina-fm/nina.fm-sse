declare global {
  interface IceCastSource {
    audio_info: string;
    channels: number;
    genre: string;
    listener_peak: number;
    listeners: number;
    listenurl: string;
    samplerate: number;
    server_description: string;
    server_name: string;
    server_type: string;
    server_url: string;
    stream_start: string;
    stream_start_iso8601: string;
    title: string;
    dummy: unknown | null;
  }

  interface IceCastStats {
    admin: string;
    host: string;
    location: string;
    server_id: string;
    server_start: string;
    server_start_iso8601: string;
    source: IceCastSource | IceCastSource[];
  }

  interface IceCastResponse {
    icestats: IceCastStats;
  }
}

export {};
