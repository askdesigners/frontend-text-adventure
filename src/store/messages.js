/* eslint-disable no-param-reassign */
export const state = () => ({
  messageList: [],
});

export const actions = {
  addServerMessage({ commit }, message) {
    commit('ADD_MESSAGE', { source: 'server', ...message });
  },
  addPlayerMessage({ commit }, message) {
    commit('ADD_MESSAGE', { source: 'player', message });
  },
};

export const mutations = {
  ADD_MESSAGE($state, message) {
    $state.messageList = [...$state.messageList, { ts: new Date().getTime(), ...message }];
  },
};
