/* eslint-disable no-param-reassign */
export const state = () => ({
  connectionState: null,
  loginState: null,
  jwt: null,
  connectedPlayers: [],
  currentPosition: {},
  currentArea: [],
  inventory: [],
  holding: {},
  playersInArea: {},
  currentTheme: null,
  playerName: null,
  loading: false,
  strength: null,
  health: null,
  currentPlace: {},
});

export const actions = {
  isLoading({ commit }, loading) {
    commit('SETLOADING', loading);
  },
  setConnectionState({ commit }, connectionState) {
    commit('SETCONNECTIONSTATE', connectionState);
  },
  setLoginState({ commit }, loginState) {
    commit('SETLOGINSTATE', loginState);
  },
  setJWT({ commit }, jwt) {
    localStorage.setItem('token', jwt);
    commit('SETJWT', jwt);
  },
  setInventory({ commit }, items) {
    commit('SETINVENTORY', items);
  },
  setHolding({ commit }, item) {
    commit('SETHOLDING', item);
  },
  setCurrentPosition({ commit }, currentPosition) {
    commit('SETCURRENTPOSITION', currentPosition);
  },
  setPlayerName({ commit }, name) {
    localStorage.playerName = name;
    commit('SETPLAYERNAME', name);
  },
  setStrength({ commit }, strength) {
    commit('SETSTRENGTH', strength);
  },
  setHealth({ commit }, health) {
    commit('SETHEALTH', health);
  },
  setCurrentPlace({ commit }, place) {
    commit('SETCURRENTPLACE', place);
  },
  loadJWT({ commit }) {
    const jwt = localStorage.getItem('token');
    commit('SETJWT', jwt);
    return jwt;
  },
  setConnectedUsers({ commit }, connectedUsers) {
    commit('SETCONNECTEDUSERS', connectedUsers);
  },
  setCurrentArea({ commit }, adjTo) {
    commit('SETCURRENTAREA', adjTo);
  },
  updatePlayersInArea({ commit, state: stateL }, { player, to }) {
    if (stateL.playerName === player) return;
    if (stateL.playersInArea[player]) {
      if (stateL.currentArea.includes(to)) {
        commit('ADDPLAYERTOAREA', { player, pos: to });
      } else {
        commit('REMOVEPLAYERFROMAREA', { player, pos: to });
      }
    } else if (stateL.currentArea.includes(to)) {
      commit('ADDPLAYERTOAREA', { player, pos: to });
    }
  },
  setCurrentTheme({ commit }, currentTheme) {
    commit('SETCURRENTTHEME', currentTheme);
  },
  setPlayerPresence({ commit }, player) {
    if (player.loggedIn) {
      commit('ADDPLAYER', player.name);
    } else {
      commit('REMOVEPLAYERFROMAREA', { player: player.name });
      commit('REMOVEPLAYER', player.name);
    }
  },
};

export const mutations = {
  SETLOADING($state, loading) {
    $state.loading = loading;
  },
  SETCONNECTIONSTATE($state, connectionState) {
    $state.connectionState = connectionState;
  },
  SETLOGINSTATE($state, loginState) {
    $state.loginState = loginState;
  },
  SETJWT($state, jwt) {
    $state.jwt = jwt;
  },
  SETINVENTORY($state, items) {
    $state.inventory = items;
  },
  SETHOLDING($state, item) {
    $state.holding = item;
  },
  SETSTRENGTH($state, strength) {
    $state.strength = strength;
  },
  SETHEALTH($state, health) {
    $state.health = health;
  },
  SETCURRENTPLACE($state, currentPlace) {
    $state.currentPlace = currentPlace;
  },
  SETCURRENTPOSITION($state, currentPosition) {
    $state.currentPosition = currentPosition;
  },
  SETPLAYERNAME($state, playerName) {
    $state.playerName = playerName;
  },
  SETCONNECTEDUSERS($state, connectedUsers) {
    $state.connectedUsers = connectedUsers;
  },
  SETCURRENTAREA($state, currentArea) {
    $state.currentArea = currentArea;
  },
  ADDPLAYERTOAREA($state, { player, pos }) {
    $state.playersInArea = { ...$state.playersInArea, [player]: pos };
  },
  REMOVEPLAYERFROMAREA($state, { player }) {
    const update = { ...$state.playersInArea };
    delete update[player];
    $state.playersInArea = { ...update };
  },
  SETCURRENTTHEME($state, currentTheme) {
    $state.currentTheme = currentTheme;
  },
  ADDPLAYER($state, playerName) {
    $state.connectedPlayers = [...$state.connectedPlayers, playerName];
  },
  REMOVEPLAYER($state, playerName) {
    $state.connectedPlayers = $state.connectedPlayers.filter(
      n => n !== playerName,
    );
  },
};
