/* eslint-disable no-param-reassign */
export const state = () => ({
  messageList: [],
  playerMessageList: [],
});

export const actions = {
  sendCommand({ commit }, message) {
    commit('ADDMESSAGE', message);
  },
  addPlayerMessage({ commit }, message) {
    commit('ADDPLAYERMESSAGE', message);
  },
};

export const mutations = {
  ADDMESSAGE($state, message) {
    $state.messageList = [...$state.messageList, message];
  },
  ADDPLAYERMESSAGE($state, message) {
    $state.playerMessageList = [...$state.playerMessageList, message];
  },
};
