(() => {
  const events = {
    todo: ($container, $orgview, orgviewEvents, settings) => {
      let $selected = $orgview.find(".select");
      if ($selected[0]) {
        let setFn = (val) => {
          let $selected = $orgview.find(".select");
          $selected.refresh(settings, Object.assign($selected.data("node"), {todo: val})).mark();
          orgviewEvents.save($orgview);
          return false;
        };
        $container.orgContext([{name: "None", fn: setFn}].concat(
          settings["todo-keywords"].map((todo) => ({name: todo, fn: () => setFn(todo)}))),
        () => $orgview.find(".select").scrollTo());
      }
      return false;
    },
    pri: ($container, $orgview, orgviewEvents, settings) => {
      let $selected = $orgview.find(".select");
      if ($selected[0]) {
        let setFn = (val) => {
          let $selected = $orgview.find(".select");
          $selected.refresh(settings, Object.assign($selected.data("node"), {pri: val})).mark();
          orgviewEvents.save($orgview);
          return false;
        };
        $container.orgContext([{name: "None", fn: setFn}].concat(
          settings["priority-letters"].map((letter) => ({name: letter, fn: () => setFn(letter)}))),
        () => $orgview.find(".select").scrollTo());
      }
      return false;
    },
    tags: () => {
      // TODO
    },
    sch: () => {
      // TODO
    },
    dl: () => {
      // TODO
    },
    props: () => {
      // TODO
    },
    note: () => {
      // TODO
    },
  };

  $.fn.orgActionbar = function($orgview, orgviewEvents, settings) {
    let that = this;
    return this.addClass("orgactionbar").html(
      `<button class="todo"><u>t</u>odo</button>
      <button class="pri">PRI</button>
      <button class="tags">TA<u>G</u></button>
      <button class="sch"><u>S</u>CH</button>
      <button class="dl"><u>D</u>L</button>
      <button class="props">PROP</button>
      <button class="note">NOTE</button>`
    ).on("click", "button", function() {
      events[this.classList[0]](that, $orgview, orgviewEvents, settings);
      return false;
    });
  };
})();
