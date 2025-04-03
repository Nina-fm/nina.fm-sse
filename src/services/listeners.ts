import { DataService } from '@lib/data.service';

export class ListenersDataService extends DataService<number> {
  constructor() {
    super();
    this.value = 0;
  }
}
