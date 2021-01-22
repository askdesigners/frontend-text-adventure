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
    console.log('done with connect');
    return this.connection;
  }

  req(route, data) {
    console.log('rwerwerer', this.natsClient.makeRequestor());
    return this.natsClient.makeRequestor().request(route, data);
  }
}
