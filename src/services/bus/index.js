import Nats from '../nats';

export default class Bus {
  constructor({ store }) {
    this.natsClient = new Nats({ servers: ['ws://localhost:9222'] });
    this.connection = null;
    this.store = store;
  }

  async init() {
    if (!this.connection) {
      this.connection = await this.natsClient.connect();
    }
    return this.connection;
  }

  addConnectionListener(listener) {
    this.natsClient.addConnectionListener(listener);
  }

  req(route, data) {
    return this.natsClient.makeRequestor().request(route, data);
  }

  async command(command) {
    this.store.dispatch('messages/addPlayerMessage', command);
    const response = await this.req('user.command', { command, jwt: this.store.state.game.jwt });
    this.store.dispatch('messages/addServerMessage', response);
    return response;
  }
}
