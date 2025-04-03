import { DataService } from '@lib/data.service';

type Events = {
  icecast: Partial<IceCastSource>;
  airtime: Partial<AirTimeResponse>;
};

export class EventsDataService extends DataService<Events> {
  constructor() {
    super();
    this.value = {
      icecast: {},
      airtime: {},
    };
  }
}
