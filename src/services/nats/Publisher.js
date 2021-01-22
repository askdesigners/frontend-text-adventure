export default class NatsPublisher {
  constructor({ client, encoder, decoder, gameServerQueue }) {
    this.client = client;
    this.encoder = encoder;
    this.decoder = decoder;
    this.gameServerQueue = gameServerQueue;
  }

  async send({ subject, payload }) {
    return this.client.publish(subject, this.encoder(payload));
  }
}
