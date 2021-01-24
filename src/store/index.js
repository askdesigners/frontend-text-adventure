import * as messages from './messages';
import * as game from './game';

const modules = {
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
