import { DataApi } from '@lib/data.api';
import parseAirTimeDate from '@lib/parse-airtime-date';
import axios from 'axios';
import { isDeepStrictEqual } from 'node:util';

export class AirTimeDataApi extends DataApi<AirTimeResponse> {
  constructor() {
    super();
    this.url = process.env.STREAM_API_URL || '';
  }

  _parseFilteredData(data: Partial<AirTimeResponse>) {
    const { schedulerTime, ...rest } = data;
    return rest;
  }

  async fetchData() {
    const { data } = await axios.get<AirTimeResponse>(this.url);

    if (
      !isDeepStrictEqual(
        this._parseFilteredData(this.data),
        this._parseFilteredData(data),
      )
    ) {
      this.data = this._parseFilteredData(data);
    }

    this.filteredData = data;
  }

  get progress() {
    if (!this.filteredData.schedulerTime) return 0;

    const schedulerTime = parseAirTimeDate(this.filteredData.schedulerTime);
    const currentStarts = parseAirTimeDate(
      this.filteredData?.current?.starts ?? '',
    );
    const currentEnds = parseAirTimeDate(
      this.filteredData?.current?.ends ?? '',
    );
    const timezoneOffset = Number(this.filteredData.timezoneOffset);
    const timeElapsed =
      schedulerTime.diff(currentStarts, 'milliseconds').milliseconds -
      timezoneOffset * 1000;
    const trackLength = currentEnds.diff(
      currentStarts,
      'milliseconds',
    ).milliseconds;

    return (timeElapsed * 100) / trackLength;
  }
}
