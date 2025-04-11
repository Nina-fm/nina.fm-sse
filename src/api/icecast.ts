import { DataApi } from '@lib/data.api';
import axios from 'axios';
import { isDeepStrictEqual } from 'node:util';
import serverConfig from 'server.config';

export class IceCastDataApi extends DataApi<IceCastSource> {
  constructor() {
    super();
    this.url = process.env.STREAM_API_URL_FALLBACK || '';
  }

  _checkableData(data: Partial<IceCastSource>) {
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
        this._checkableData(this.data),
        this._checkableData(response),
      )
    ) {
      return false;
    }

    this.data = response;
    return true;
  }

  get listeners() {
    return this.data.listeners ?? 0;
  }
}
