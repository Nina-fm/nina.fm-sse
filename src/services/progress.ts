import { DataService } from "@lib/data.service";

export class ProgressDataService extends DataService<number> {
  constructor() {
    super();
    this.value = 0;
  }
}
