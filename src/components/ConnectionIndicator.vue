<template>
  <p class="ConnectionIndicator p-1">{{status}}</p>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  name: 'ConnectionIndicator',
  mounted() {
    this.$bus.addConnectionListener(this.updateStatus);
  },
  methods: {
    updateStatus(status) {
      this.$store.dispatch('game/setConnectionState', status.type);
    },
  },
  computed: {
    status() {
      switch (this.$store.state.game.connectionState) {
        case 'disconnect':
          return 'disconnect';
        case 'reconnecting':
          return 'reconnecting';
        case 'reconnect':
          return 'connected';
        case 'initialConnect':
          return 'connected';
        case 'pingTimer':
          return 'connected';
        default:
          return 'unknown';
      }
    },
  },
});
</script>

<style>
.ConnectionIndicator {
  position: absolute;
  top: 0;
  right: 20px;
}
</style>
