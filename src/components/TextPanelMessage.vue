<template>
  <div class="TextPanelMessageWrapper rounded-md mb-2" :class="{'shadow-xl': isLatest}">
    <div v-if="message.source === 'game'" class="GameMessage p-2">
      <p
        class="TextPanelPlaceName font-bold text-sm p-1"
        v-if="message.place"
      >{{message.place.name}}</p>
      <p class="TextPanelMessage p-1" v-html="markedUpMessage"></p>
    </div>
    <div v-else-if="message.source === 'playerChat'" class="PlayerChatMessage p-2">
      <p class="TextPanelPlaceName font-bold text-sm p-1">{{message.player}} says:</p>
      <p class="TextPanelMessage p-1" v-html="markedUpMessage"></p>
    </div>
    <div v-else-if="message.source === 'player'" class="PlayerMessage p-2">
      <p class="TextPanelMessage p-1" v-html="markedUpMessage"></p>
    </div>
    <div v-else class="DefaultMessage p-2">
      <p class="TextPanelMessage p-1" v-html="markedUpMessage"></p>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  name: 'TextPanelMessage',
  props: {
    isLatest: Boolean,
    message: {
      type: Object,
      required: true,
    },
  },
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
    dirIcon() {
      switch (this.message.dir) {
        case 'south':
          return '↓';
        case 'north':
          return '↑';
        case 'east':
          return '→';
        case 'west':
          return '←';
        default:
          return '○';
      }
    },
  },
  mounted() {},
});
</script>

<style>
.TextPanelMessageWrapper {
  max-width: 600px;
}

.TextPanelMessageWrapper.PlayerMessage {
  background: transparent;
  box-shadow: none;
  text-align: right;
  font-weight: 700;
}

.DefaultMessage,
.GameMessage {
  background: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.PlayerChatMessage {
  background: lightgoldenrodyellow;
  box-shadow: none;
  text-align: right;
}

.DirectionWrap {
  /* padding: 0.15rem 0.25rem; */
  border-bottom: 3px solid #81e6d9;
}
</style>
