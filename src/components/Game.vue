<template>
  <div class="GamePanelWrapper bg-gray-100">
    <ConnectionIndicator />
    <div class="GamNavWrapper p-2"></div>
    <TextPanel />
    <form class="PlayerInput p-4 shadow-2xl" v-on:submit.prevent="submitPlayerInput()">
      <PlayerPresenceBar />
      <div class="LowerBar flex items-center pt-1">
        <input
          class="Input border-solid border-2 border-teal-400 bg-teal-300 mr-3 flex-grow"
          v-model="playerInput"
        />
        <button class="PlayerInputSubmit Button Button--green">send ⮐</button>
      </div>
    </form>
  </div>
</template>

<script>
import Vue from 'vue';
import TextPanel from '../components/TextPanel';
import PlayerPresenceBar from '../components/PlayerPresenceBar';
import ConnectionIndicator from '../components/ConnectionIndicator';

export default Vue.extend({
  components: {
    TextPanel,
    ConnectionIndicator,
    PlayerPresenceBar,
  },
  data() {
    return {
      playerInput: null,
    };
  },
  computed: {
    playerName() {
      return this.$store.state.game.playerName;
    },
    token() {
      return this.$store.state.game.jwt;
    },
  },
  mounted() {
    if (this.token) {
      console.log(this.token);
    } else {
      this.$router.push('/login').catch();
    }
  },
  methods: {
    submitPlayerInput() {
      if (this.playerInput) {
        this.$bus.command(this.playerInput);
        this.playerInput = null;
      }
    },
  },
});
</script>

<style>
.GamePanelWrapper {
  height: calc(100vh - 90px);
  overflow-y: scroll;
}
.PlayerInput {
  background: white;
  position: absolute;
  bottom: 0;
  width: 100%;
}
</style>
