export class DataApi<Type> {
  protected _url: string = '';
  protected _data: Partial<Type> = {};
  protected _filteredData: Partial<Type> = {};

  constructor() {}

  set url(url: string) {
    this._url = url;
  }

  get url(): string {
    return this._url;
  }

  set data(data: Partial<Type>) {
    this._data = data;
  }

  get data(): Partial<Type> {
    return this._data;
  }

  set filteredData(filteredData: Partial<Type>) {
    this._filteredData = filteredData;
  }

  get filteredData(): Partial<Type> {
    return this._filteredData;
  }
}
