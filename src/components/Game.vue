<template>
  <div class="GamePanelWrapper grid gap-4 grid-cols-6 grid-rows-6 bg-gray-100">
    <ConnectionIndicator class="col-span-1 col-start-6"/>
    <div class="GamNavWrapper col-span-4 col-start-2 row-start-1">
      <PlacePanel />
      <TextPanel />
    </div>
    <form class="PlayerInput col-span-4 col-start-2 row-span-1 row-start-6" v-on:submit.prevent="submitPlayerInput()">
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
import PlacePanel from '../components/PlacePanel';
import PlayerPresenceBar from '../components/PlayerPresenceBar';
import ConnectionIndicator from '../components/ConnectionIndicator';

export default Vue.extend({
  components: {
    TextPanel,
    PlacePanel,
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
  async mounted() {
    if (!this.token) {
      this.$router.push('/login').catch();
    }
    await this.$bus.init();
    await this.fetchPlayer();
    this.fetchPlace();
  },
  methods: {
    submitPlayerInput() {
      if (this.playerInput) {
        this.$bus.command(this.playerInput);
        this.playerInput = null;
      }
    },
    async fetchPlayer() {
      return this.$bus.getPlayer();
    },
    async fetchPlace() {
      const { x, y } = this.$store.state.game.currentPosition;
      this.$bus.getCurrentPlace({ x, y });
    },
  },
});
</script>

<style>
.GamePanelWrapper {
  height: 100vh;
  overflow-y: scroll;
}
</style>
