import Vue from 'vue';
import Router from 'vue-router';
import Login from '@/components/Login';
import Game from '@/components/Game';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login,
    },
    {
      path: '/g',
      name: 'Game',
      component: Game,
    },
  ],
});
