<template>
  <div class="SetNameFormWrapper flex items-center justify-center">
    <form
      class="SetNameForm flex items-center justify-center flex-col p-8 bg-orange-200 shadow-2xl"
      v-on:submit.prevent="login()"
    >
      <h1 class="text-sm font-bold mb-5">Welcome intrepid traveler</h1>
      <h2 class="text-lg mb-5">What do you call yourself?</h2>
      <input class="Input mb-5" type="text" v-model="name"/>
      <input class="Input mb-5" type="password" v-model="password"/>
      <p v-if="loginError">Hmmm, that doesn't seem right...</p>
      <button class="Button Button--grey">Login</button>
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
      loginError: null,
    };
  },
  computed: {
    loading: () => this.$store.state.game.isLoading,
  },
  methods: {
    async login() {
      this.loginError = false;
      this.$store.dispatch('game/isLoading', true);
      const result = await this.$bus.req('user.login', { username: this.name, password: this.password });
      this.$store.dispatch('game/isLoading', false);
      if (result && result.success) {
        this.$store.dispatch('game/setPlayerName', this.name);
        this.$router.push('g').catch();
      } else {
        this.loginError = true;
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
