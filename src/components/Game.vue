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
      game: {},
      playerInput: null,
    };
  },
  computed: {
    playerName() {
      return this.$store.state.map.playerName;
    },
  },
  mounted() {
    // deepStream.initConnectionListener((status) => {
    //   this.$store.dispatch('connection/setConnectionState', status);
    // });
    if (this.playerName) {
      // deepStream.doLogin({ username: this.playerName });

      // deepStream.getAllConnectedUsers((error, users) => {
      //   if (!users) return;
      //   this.$store.dispatch(
      //     'map/setPlayerPresence',
      //     users.map(u => ({ name: u, loggedIn: true })),
      //   );
      // });

      // deepStream.subscribePresence((name, loggedIn) => {
      //   console.log('just logged in', name, loggedIn);
      //   this.$store.dispatch('map/setPlayerPresence', { name, loggedIn });

      //   // if a new user logs in, send our pos to get them up to speed
      //   if (loggedIn) {
      //     setTimeout(() => {
      //       deepStream.emitEvent('player/move', {
      //         player: this.playerName,
      //         to: this.$store.state.map.currentPosition,
      //         from: this.$store.state.map.currentPosition,
      //       });
      //     }, 200);
      //   }
      // });

      this.game.addMoveListener();
      this.game.addChatListener();
    } else {
      this.$router.push('/');
    }
  },
  methods: {
    submitPlayerInput() {
      if (this.playerInput) {
        this.game.sendMessage(this.playerInput);
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
