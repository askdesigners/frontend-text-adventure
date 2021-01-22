/* eslint-disable no-restricted-syntax */

export default class NatsSubscription {
  constructor({
    client,
    subject,
    middleware,
    handler,
    encoder,
    decoder,
    gameServerQueue,
  }) {
    this.client = client;
    this.handler = handler;
    this.middleware = [];
    this.encoder = encoder;
    this.decoder = decoder;
    this.sub = this.client.subscribe(subject, gameServerQueue);
    this.use(message => ({ ...message, body: decoder(message.data) }));
    if (middleware.length) {
      middleware.forEach((mw) => {
        this.use(mw);
      });
    }
    this.startListening().then(() => {
      console.log(`[NATS] subscription ${subject} closed`);
    });
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  applyMiddleware(message) {
    if (this.middleware.length) {
      this.middleware.reduce((msg, mdw) => mdw(msg), message);
    }
  }

  async startListening() {
    console.info(`[NATS] Listening to ${this.sub.getSubject()}`);
    for await (const message of this.sub) {
      const parsed = this.applyMiddleware(message);
      const result = this.handler(parsed);
      if (message.respond(this.encoder(result))) {
        console.info(
          // eslint-disable-next-line prettier/prettier
          `[NATS] message on ${this.sub.getSubject()} – ${this.sub.getProcessed()}`,
        );
      } else {
        console.log(`[NATS] skip reply to message on ${this.sub.getSubject()}`);
      }
    }
  }
}
