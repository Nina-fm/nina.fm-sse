import { DataApi } from '@lib/data.api';
import parseAirTimeDate from '@lib/parse-airtime-date';
import axios from 'axios';
import { isDeepStrictEqual } from 'node:util';

export class AirTimeDataApi extends DataApi<AirTimeResponse> {
  constructor() {
    super();
    this.url = process.env.STREAM_API_URL || '';
  }

  async fetchData() {
    const { data } = await axios.get<AirTimeResponse>(this.url);
    const { schedulerTime, ...response } = data;

    if (isDeepStrictEqual(this.data, response)) {
      return false;
    }

    this.data = data;
    return true;
  }

  get progress() {
    if (!this.data.schedulerTime) return 0;

    const schedulerTime = parseAirTimeDate(this.data.schedulerTime);
    const currentStarts = parseAirTimeDate(this.data?.current?.starts ?? '');
    const currentEnds = parseAirTimeDate(this.data?.current?.ends ?? '');
    const timezoneOffset = Number(this.data.timezoneOffset);
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
