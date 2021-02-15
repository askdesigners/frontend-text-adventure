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
          return 'disconnected';
        case 'reconnecting':
          return 'reconnecting';
        case 'reconnect':
          return '';
        case 'initialConnect':
          return '';
        case 'pingTimer':
          return '';
        default:
          return 'unknown';
      }
    },
  },
});
</script>

<style>
</style>
