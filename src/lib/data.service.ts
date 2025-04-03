import { Response } from "express";
import { isDeepStrictEqual } from "node:util";

export class DataService<Type> {
  protected _clients: Client[] = [];
  protected _value: Type | null = null;

  constructor() {}

  set clients(clients: Client[]) {
    this._clients = clients;
  }

  get clients(): Client[] {
    return this._clients;
  }

  set value(value: Type) {
    if (isDeepStrictEqual(this._value, value)) {
      return;
    }

    this._value = value;
    this.dispatch();
  }

  get value(): Type | null {
    return this._value;
  }

  get response() {
    const data = ["object", "array"].includes(typeof this.value)
      ? JSON.stringify(this.value)
      : this.value;

    return `data: ${data}\n\n`;
  }

  addClient(response: Response) {
    const client = {
      id: Date.now(),
      response,
    };
    this.clients.push(client);

    return client;
  }

  removeClient(id: number) {
    this.clients = this.clients.filter((client) => client.id !== id);
  }

  dispatch() {
    this.clients.forEach((client) => client.response.write(this.response));
  }
}
