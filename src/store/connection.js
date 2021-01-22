/* eslint-disable no-param-reassign */
export const state = () => ({
  connectionState: null,
  loginState: null,
  jwt: null,
});

export const actions = {
  setConnectionState({ commit }, connectionState) {
    commit('SETCONNECTIONSTATE', connectionState);
  },
  setLoginState({ commit }, loginState) {
    commit('SETLOGINSTATE', loginState);
  },
  setJWT({ commit }, loginState) {
    commit('SETJWT', loginState);
  },
};

export const mutations = {
  SETCONNECTIONSTATE($state, connectionState) {
    $state.connectionState = connectionState;
  },
  SETLOGINSTATE($state, loginState) {
    $state.loginState = loginState;
  },
  SETJWT($state, jwt) {
    $state.jwt = jwt;
  },
};
