/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
// eslint-disable-next-line import/extensions
import { connect, JSONCodec } from '../../vendor/nats.js';
import Subscription from './Subscription';
import Publisher from './Publisher';
import Requester from './Requester';

const gameServerQueue = { queue: 'game.workers' };
const { decode, encode } = JSONCodec();

export default class NatsClient {
  constructor({ servers }) {
    this.servers = servers;
    this.natClient = null;
    this.requestor = null;
    this.connectionListener = null;
  }

  async connect(opts) {
    this.natsClient = await connect({
      headers: true,
      servers: this.servers,
      ...opts,
    });
    console.log('[NATS] connected');
    this.listenForConnectionChanges();
    return this.natsClient;
  }

  async listenForConnectionChanges() {
    if (this.connectionListener) this.connectionListener({ type: 'initialConnect' });
    for await (const s of this.natsClient.status()) {
      console.log('status', s);
      if (this.connectionListener) this.connectionListener(s);
    }
  }

  addConnectionListener(listener) {
    this.connectionListener = listener;
  }

  makeSubscription(options) {
    return new Subscription({
      ...options,
      client: this.natsClient,
      gameServerQueue,
      decoder: decode,
      encoder: encode,
    });
  }

  makePublisher() {
    this.publisher = new Publisher({
      client: this.natsClient,
      gameServerQueue,
      decoder: decode,
      encoder: encode,
    });
  }

  makeRequestor() {
    if (!this.requestor) {
      const opts = {
        client: this.natsClient,
        gameServerQueue,
        decoder: decode,
        encoder: encode,
      };
      console.log(opts);
      this.requestor = new Requester(opts);
    }
    return this.requestor;
  }
}
