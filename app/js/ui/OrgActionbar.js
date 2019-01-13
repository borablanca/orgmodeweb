(() => {
  const events = {
    todo: ($orgview, orgviewEvents, settings) => {
      let $selected = $orgview.find(".select");
      if ($selected[0]) {
        let setFn = (val) => {
          $selected.refresh(settings, Object.assign($selected.data("node"), {todo: val})).mark();
          orgviewEvents.save($orgview);
          return false;
        };
        let todos = [{name: "None", fn: setFn}];
        let todoKeywords = settings["todo-keywords"];
        for (let i = 0, l = todoKeywords.length, curTodo; i < l; i++) {
          curTodo = todoKeywords[i];
          if (curTodo.length > 1) todos[todos.length] = {name: curTodo, fn: () => setFn(curTodo)};
        }
        $orgview.orgContext(todos, () => $orgview.find(".select").scrollTo());
      }
      return false;
    },
    pri: ($orgview, orgviewEvents, settings) => {
      let $selected = $orgview.find(".select");
      if ($selected[0]) {
        let setFn = (val) => {
          $selected.refresh(settings, Object.assign($selected.data("node"), {pri: val})).mark();
          orgviewEvents.save($orgview);
          return false;
        };
        $orgview.orgContext([{name: "None", fn: setFn}].concat(
          settings["priority-letters"].map((letter) => ({name: letter, fn: () => setFn(letter)}))),
        () => $orgview.find(".select").scrollTo());
      }
      return false;
    },
    tags: ($orgview, orgviewEvents, settings) => {
      let $selected = $orgview.find(".select");
      if ($selected[0]) {
        let curTags = $selected.data("node").tags;
        $orgview.orgNotify({
          content: "Tag(s): ",
          prompt: true,
          value: curTags ? curTags.split(":").filter(Boolean).join(" ") : "",
          confirm: () => {
            let newTags = $(".orgnotify input", $orgview).val().split(/:| +/);
            newTags = newTags.filter((item, index) => {
              return item.length && newTags.indexOf(item) >= index;
            }).join(":");
            let data = Object.assign($selected.data("node"), {tags: newTags.length ? (":" + newTags + ":") : undefined});
            $selected.refresh(settings, data).mark();
            return orgviewEvents.save($orgview);
          },
        });
      }
      return false;
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
    return this.addClass("orgactionbar").html(
      `<button class="todo"><u>t</u>odo</button>
      <button class="pri">PRI</button>
      <button class="tags">TA<u>G</u></button>
      <button class="sch" disabled><u>S</u>CH</button>
      <button class="dl" disabled><u>D</u>L</button>
      <button class="props" disabled>PROP</button>
      <button class="note" disabled>NOTE</button>`
    ).on("click", "button", function() {
      events[this.classList[0]]($orgview, orgviewEvents, settings);
      return false;
    });
  };
})();
