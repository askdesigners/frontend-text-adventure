import Nats from '../nats';

export default class Bus {
  constructor() {
    this.natsClient = new Nats({ servers: ['ws://localhost:9222'] });
    this.connection = null;
  }

  async init() {
    if (!this.connection) {
      this.connection = await this.natsClient.connect();
    }
    return this.connection;
  }

  req(route, data) {
    return this.natsClient.makeRequestor().request(route, data);
  }
}
