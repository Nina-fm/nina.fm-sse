import { DataApi } from '@lib/data.api';
import axios from 'axios';
import { isDeepStrictEqual } from 'node:util';
import serverConfig from 'server.config';

export class IceCastDataApi extends DataApi<IceCastSource> {
  constructor() {
    super();
    this.url = process.env.STREAM_API_URL_FALLBACK || '';
  }

  _parseFilteredData(data: Partial<IceCastSource>) {
    const { listeners, listener_peak, ...rest } = data;
    return rest;
  }

  _getSource(data: IceCastResponse) {
    if (Array.isArray(data.icestats.source)) {
      return (
        data.icestats.source.find(
          (s) => s.listenurl === serverConfig.streamUrl,
        ) ?? data.icestats.source[0]
      );
    }
    return data.icestats.source;
  }

  async fetchData() {
    const { data } = await axios.get<IceCastResponse>(this.url);
    const response = this._getSource(data);

    if (
      isDeepStrictEqual(
        this._parseFilteredData(this.data),
        this._parseFilteredData(response),
      )
    ) {
      this.data = this._parseFilteredData(response);
    }

    this.filteredData = response;
  }

  get listeners() {
    return this.filteredData.listeners ?? 0;
  }
}
