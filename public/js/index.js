$(function() {
  $(".dropdown button").click(function() {
    const menu = $(this).parent().find(".dropdown-menu");
    menu.toggle();
    $(".dropdown-menu").not(menu).hide();
  });

  window.onclick = function(event) {
    if (!event.target.matches(".dropdown button")) {
      $(".dropdown-menu").hide();
    }
  }
});

const vm = new Vue({
  el: "#tree-container",
  data: {
    name: "Untitled",
    root: root,
  },
  watch: {
    name: {
      immediate: true,
      handler: function(name) {
        document.title = name + " | Willow";
      },
    },
  },
  components: {
    treeNode: {
      name: "tree-node",
      data: () => ({
        expanded: true,
      }),
      props: {
        node: Object,
        branches: {
          type: Array,
          default: () => [],
        },
      },
      template: `
<ul class="node-list">
  <li v-for="(statement, idx) in node.statements">
    <input v-if="idx == 0 || expanded" v-model="statement.str" class="statement" type="text" oninput="makeSubstitutions(this)" :branches="JSON.stringify(branches)" :offset="idx"/>
    <button v-if="idx == 0 && (node.statements.length > 1 || node.children.length > 1)" @click="expanded = !expanded" class="expand-arrow">{{ expanded ? "▼" : "►" }}</button>
  </li>
  <li v-if="(node.statements.length > 1 || node.children.length > 1) && !expanded" class="dots">⋮</li>
  <template v-if="expanded" v-for="(child, idx) in node.children">
    <hr class="branch-line">
    <tree-node :node="child" :branches="[...branches, idx]"/>
  </template>
</ul>`,
    }
  }
});