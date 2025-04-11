import { DataApi } from '@lib/data.api';
import parseAirTimeDate from '@lib/parse-airtime-date';
import axios from 'axios';
import { isDeepStrictEqual } from 'node:util';

export class AirTimeDataApi extends DataApi<AirTimeResponse> {
  private _filteredData: Partial<AirTimeResponse> = {};

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

    this._filteredData = data;
  }

  get progress() {
    if (!this._filteredData.schedulerTime) return 0;

    const schedulerTime = parseAirTimeDate(this._filteredData.schedulerTime);
    const currentStarts = parseAirTimeDate(
      this._filteredData?.current?.starts ?? '',
    );
    const currentEnds = parseAirTimeDate(
      this._filteredData?.current?.ends ?? '',
    );
    const timezoneOffset = Number(this._filteredData.timezoneOffset);
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
