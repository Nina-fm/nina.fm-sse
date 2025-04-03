declare global {
  type Environment = "production" | "staging" | "development";

  type TrackType = "track" | "show";

  interface Block {
    name: string;
    starts: string;
    ends: string;
    type: TrackType;
  }

  interface CurrentBlock extends Block {
    media_item_played: boolean;
    record: number;
  }

  interface ShowBlock extends Block {
    start_timestamp: string;
    end_timestamp: string;
    id: number;
    instance_id: number;
    record: number;
    url: string;
    [key: string]: string | number;
  }

  interface AirTimeResponse {
    env: Environment;
    schedulerTime: string;
    previous: Block;
    current: CurrentBlock;
    next: Block;
    currentShow: Block[];
    nextShow: ShowBlock[];
    timezone: string;
    timezoneOffset: string;
    AIRTIME_API_VERSION: string;
  }
}

export {};
