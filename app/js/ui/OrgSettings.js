(() => {
  const itemTmpl = (name, value) =>
    `<li class="collapsed" data-setting="${name}" data-lvl="1">
      <b class="title">${name}</b>
      <pre>${value}</pre>
    </li>`;

  const itemEditTmpl = (name = "", value = "") =>
    `<li class="edit" data-setting="${name}" data-lvl="1">
      <input type="text" placeholder="setting name" value="${name}"/>
      <textarea placeholder="value">${value}</textarea>
      ${ORG.icon("done")}${ORG.icon("close")}${ORG.icon("reset")}
    </li>`;

  const init = ($container) => {
    let events = {
      edit: ($li) => $(itemEditTmpl($li.data("setting"), $li.find("pre").text()))
        .replaceAll($li).mark()
        .find("input").focus().end()
        .find("textarea").autoHeight(),
      close: ($li, value) => value !== undefined ?
        $(itemTmpl($li.data("setting"), value)).replaceAll($li).mark() : $li.remove(),
      done: ($li, oldValue) => {
        let oldName = $li.data("setting");
        let $inputs = $li.find("input");
        let newName = $inputs.val().trim();
        if (!newName) {
          return oldValue !== undefined ? $(itemTmpl(oldName, oldValue)).replaceAll($li).mark() : $li.remove();
        }
        let newValue = $inputs.next().val().trim();
        let settings = ORG.Settings.getSettings(true);
        delete settings[oldName];
        settings[newName] = newValue;
        ORG.Settings.setSettings(settings);
        return $(itemTmpl(newName, newValue)).replaceAll($li).mark();
      },
      reset: ($li, value) => $container.orgNotify({
        content: (value !== undefined ? "Reset to default " : "Cancel setting ") + $li.find("input").val() + "?",
        confirm: () => {
          let settings = ORG.Settings.getSettings(true);
          delete settings[$li.data("setting")];
          ORG.Settings.setSettings(settings);
          $container.orgSettings(ORG.Settings.getSettings());
        },
      }),
    };
    $(document).orgKeyboard({
      "return": [() => events.edit($container.find(".select")), {
        delegate: "input",
        fn: (ev) => $(ev.target).next().focus().moveCaret().trigger("keydown"),
      }],
      "esc": [() => $container.find(".select.edit .close").click(), {
        delegate: "input,textarea",
        fn: (ev) => $(ev.target).siblings(".close").click(),
      }],
      "ctrl+return": [() => $container.find(".orgnavbar .add").click(), {
        delegate: "input,textarea",
        fn: (ev) => $(ev.target).siblings(".done").click(),
      }],
      "shift+tab": () => $container.find(".orgnavbar .cycle").click(),
      "tab": () => {
        let $selected = $container.find(".select");
        return $selected.hasClass("edit") ? $selected.find("input").focus() : $selected.toggleClass("collapsed");
      },
      "n": () => $container.find(".select").move(),
      "down": [() => $container.find(".select").move(), {
        delegate: "input",
        fn: (ev) => $(ev.target).next().focus(),
      }],
      "p": () => $container.find(".select").move("prev"),
      "up": () => $container.find(".select").move("prev"),
    });
    $.isMobile() && $container.on("contextmenu", "li:not(.edit)", function() {
      events.edit($(this));
      return false;
    });
    return $container.on("click", "li:not(.edit)", function(ev) {
      $(this).mark().toggleClass("collapsed");
      return false;
    }).on("click", "pre", function() {
      $(this).mark();
      return false;
    }).on("click", ".orgicon", function() {
      let $li = $(this).closest("li");
      events[this.classList[1]]($li, ORG.Settings.getSettings()[$li.data("setting")]);
      return false;
    }).on("input", "textarea", (ev) => $(ev.target).autoHeight());
  };

  $.fn.orgSettings = function(settings) {
    return init(this.removeData().off().empty().append(
      $(document.createElement("div")).orgNavbar({
        add: () => $(itemEditTmpl()).appendTo(this.find(".orgsettings")).scrollTo().find("input").focus(),
        cycle: () => {
          let $allLi = this.find(".orgsettings li");
          return $allLi[$allLi.first().hasClass("collapsed") ? "removeClass" : "addClass"]("collapsed");
        },
        reset: () => this.orgNotify({
          content: "Reset all settings to default values?",
          confirm: () => ORG.Store.setSettings({}) && this.orgSettings(),
        }),
        title: "Settings",
      }),
      $(document.createElement("ul")).addClass("orgsettings orgview").append(
        Object.keys(settings).sort().map((s) => itemTmpl(s, settings[s]))
      ).find(">li:first-child").addClass("select").end()
    ));
  };
})();
