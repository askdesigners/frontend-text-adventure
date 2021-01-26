// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import Vuex from 'vuex';

import App from './App';
import router from './router';
import modules from './store';
import Bus from './services/bus';

Vue.use(Vuex);
const store = new Vuex.Store({ modules });

Vue.config.productionTip = false;

Vue.prototype.$bus = new Bus({ store });

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
});
