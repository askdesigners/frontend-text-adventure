<template>
  <div class="TextPanelWrapper">
    <div class="TextPanelHistory p-2">
      <transition-group name="slide-in" tag="div" class="HistoryMessageWrapper">
        <TextPanelMessage
          v-for="(message, index) in messageList"
          :key="message.ts"
          :message="message"
          :ref="message.ts"
          :isLatest="(index+1) === messageList.length"
        />
      </transition-group>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import TextPanelMessage from './TextPanelMessage';

export default Vue.extend({
  name: 'TextPanel',
  components: { TextPanelMessage },
  data() {
    return {};
  },
  watch: {
    messageList(list) {
      console.log(list);
      setTimeout(() => {
        document
          .querySelector('.GamePanelWrapper')
          .scrollTo(
            80,
            document.querySelector('.GamePanelWrapper').scrollHeight,
          );
      }, 10);
    },
  },
  computed: {
    messageList() {
      return [...this.$store.state.messages.messageList];
    },
  },
  mounted() {},
});
</script>

<style>
</style>
