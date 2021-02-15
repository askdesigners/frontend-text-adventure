<template>
  <div class="TextPanelWrapper">
    <div class="TextPanelHistory p-2">
      <transition-group name="slide-in" tag="div" class="HistoryMessageWrapper">
        <h2 key="title">place {{place.key}}</h2>
        <p key="name" class="TextPanelMessage p-1">{{place.name}}</p>
        <p key="description" class="TextPanelMessage p-1">{{place.description}}</p>
      </transition-group>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  name: 'PlacePanel',
  components: {},
  data() {
    return {};
  },
  computed: {
    markedUpMessage() {
      const msg = this.message.message.replace(
        /(east|west|north|south+)/g,
        '<span class="DirectionWrap">$1</span>',
      );
      return msg;
    },
    place() {
      console.log(this.$store.state.game.currentPlace);
      return this.$store.state.game.currentPlace;
    },
  },
  mounted() {},
});
</script>

<style>
</style>
