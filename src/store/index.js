import * as connection from './connection';
import * as messages from './messages';
import * as game from './game';

const modules = {
  connection: {
    namespaced: true,
    ...connection,
  },
  messages: {
    namespaced: true,
    ...messages,
  },
  game: {
    namespaced: true,
    ...game,
  },
};

export default modules;
