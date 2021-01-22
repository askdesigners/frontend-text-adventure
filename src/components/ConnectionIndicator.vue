<template>
  <p class="ConnectionIndicator p-1">{{status}}</p>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  name: 'ConnectionIndicator',
  computed: {
    status() {
      console.log(this.$store.state.connection.connectionState);
      switch (this.$store.state.connection.connectionState) {
        case 'INITIALISING':
          return '🕐';
        case 'AWAITING_CONNECTION':
          return '🕔';
        case 'CHALLENGING':
          return '🕚';
        case 'AWAITING_AUTHENTICATION':
          return '🕝';
        case 'AUTHENTICATING':
          return '🔓';
        case 'OPEN':
          return '';
        default:
          return 'No Connection';
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
