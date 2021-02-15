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
    if (response.place) {
      this.store.dispatch('game/setCurrentPosition', { x: response.place.x, y: response.place.y });
      this.store.dispatch('game/setCurrentPlace', response.place);
    }
    return response;
  }

  async getPlayer(command) {
    const { user } = await this.req('user.get', { command, jwt: this.store.state.game.jwt });
    console.log(user);
    this.store.dispatch('game/setInventory', user.inventory);
    this.store.dispatch('game/setHolding', user.holding);
    this.store.dispatch('game/setCurrentPosition', { x: user.x, y: user.y });
    this.store.dispatch('game/setPlayerName', user.name);
    this.store.dispatch('game/setStrength', user.strength);
    this.store.dispatch('game/setHealth', user.health);
  }

  async getCurrentPlace({ x, y }) {
    const { place } = await this.req('map.getPlace', { x, y, jwt: this.store.state.game.jwt });
    this.store.dispatch('game/setCurrentPlace', place);
  }
}
