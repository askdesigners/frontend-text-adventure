export default class NatsRequester {
  constructor({ client, encoder, decoder, gameServerQueue }) {
    this.client = client;
    this.encoder = encoder;
    this.decoder = decoder;
    this.gameServerQueue = gameServerQueue;
  }

  async request(route, data) {
    // a client makes a request and receives a promise for a message
    // by default the request times out after 1s (1000 millis) and has
    // no payload.
    console.log('[NATS] request:', data);
    return this.client
      .request(route, this.encoder(data), {
        timeout: 2000,
        ...this.gameServerQueue,
      })
      .then((m) => {
        const response = this.decoder(m.data);
        console.log('[NATS] got response:', response);
        return response;
      })
      .catch((err) => {
        console.log('[NATS] problem with request', err);
        return { success: false, err };
      });
  }
}
