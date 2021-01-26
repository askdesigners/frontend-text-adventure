    <template>
  <div class="NearbyPlayerBar flex">
    <p class="PlayerIdent font-hand">{{playerName}}</p>
    <transition-group name="slide-fade" tag="div" class="ml-auto flex">
      <p
        class="PlayerName text-xs p-2 bg-teal-300 rounded-md ml-2"
        v-for="player in areaPlayers"
        :key="player.name"
        :title="player.pos"
      >
        <span class="PlayerSymbol mr-1 text-xs">🙎‍♂️</span>
        {{player.name}}
      </p>
    </transition-group>
  </div>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  name: 'PlayerPresenceBar',
  computed: {
    playerName() {
      return this.$store.state.game.playerName;
    },
    areaPlayersVal() {
      return this.$store.state.game.playersInArea;
    },
    areaPlayers() {
      return Object.keys(this.$store.state.game.playersInArea).map(p => ({
        name: p,
        pos: this.$store.state.game.playersInArea[p],
      }));
    },
  },
});
</script>

<style>
.NearbyPlayerBar {
  /* position: ab */
}

.PlayerName {
}
</style>
