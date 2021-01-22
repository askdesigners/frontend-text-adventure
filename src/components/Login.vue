<template>
  <div class="SetNameFormWrapper flex items-center justify-center">
    <form
      class="SetNameForm flex items-center justify-center flex-col p-8 bg-orange-200 shadow-2xl"
      v-on:submit.prevent="setName()"
    >
      <h1 class="text-sm font-bold mb-5">Welcome intrepid traveler</h1>
      <h2 class="text-lg mb-5">What do you call yourself?</h2>
      <input class="Input mb-5" type="text" v-model="name" />
      <button class="Button Button--grey">Begin</button>
    </form>
  </div>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      name: '',
    };
  },
  methods: {
    setName() {
      this.$store.dispatch('map/setPlayerName', this.name);
      this.$router.push('adventure/go');
    },
  },
});
</script>

<style>
.SetNameFormWrapper {
  min-height: 100vh;
}

.SetNameForm {
  max-width: 400px;
  border-radius: 10px;
}
</style>
