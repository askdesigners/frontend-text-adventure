<template>
  <div class="SetNameFormWrapper flex items-center justify-center">
    <form
      class="SetNameForm flex items-center justify-center flex-col p-8 bg-orange-200 shadow-2xl"
      v-on:submit.prevent="signup()"
    >
      <h1 class="text-sm font-bold mb-5">Welcome intrepid traveler</h1>
      <h2 class="text-lg mb-5">What do you call yourself?</h2>
      <input type="text" placeholder="name" v-model="name" @input="checkName"/>
      <input placeholder="password" type="password" v-model="password" v-if="nameIsFree"/>
      <p v-if="nameIsFree">Name is free!</p>
      <p v-if="nameIsFree === false">Name is not free</p>
      <button class="Button Button--grey" :disabled="nameIsFree !== true">Begin</button>
    </form>
  </div>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      name: '',
      password: '',
      nameIsFree: null,
    };
  },
  computed: {
    loading: () => this.$store.state.game.isLoading,
  },
  methods: {
    async checkName() {
      // this needs a debounce
      this.$store.dispatch('game/isLoading', true);
      const result = await this.$bus.req('user.checkName', { username: this.name });
      this.nameIsFree = result.isFree;
      this.$store.dispatch('game/isLoading', false);
    },
    async signup() {
      const { user } = await this.$bus.req('user.signup', { username: this.name, password: this.password });
      if (user) {
        this.$store.dispatch('game/setPlayerName', user.name);
        this.$store.dispatch('game/setJWT', user.jwt);
        this.$router.push('/g').catch();
      }
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
