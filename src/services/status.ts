import { DataService } from "@lib/data.service";

type Status = {
  clients: {
    events: number;
    listeners: number;
    progress: number;
  };
};

export class StatusDataService extends DataService<Status> {
  constructor() {
    super();
    this.value = {
      clients: {
        listeners: 0,
        progress: 0,
        events: 0,
      },
    };
  }
}
