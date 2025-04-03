import { DataApi } from "@lib/data.api";
import axios from "axios";
import { isDeepStrictEqual } from "node:util";

export class IceCastDataApi extends DataApi<IceCastSource> {
  constructor() {
    super();
    this.url = process.env.STREAM_API_URL_FALLBACK || "";
  }

  async fetchData() {
    const { data } = await axios.get<IceCastResponse>(this.url);
    const response = data.icestats.source;

    if (isDeepStrictEqual(this.data, response)) {
      return false;
    }

    this.data = response;
    return true;
  }

  get listeners() {
    return this.data.listeners ?? 0;
  }
}
