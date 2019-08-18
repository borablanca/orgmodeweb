(() => {
  const itemTmpl = (setting, collapsed = false) => `
  <li class="${collapsed ? "collapsed " : ""}lvl1" data-setting="${setting.name}" data-lvl="1">
   <span class="title">${ORG.Utils.htmlEncode(setting.name)}</span>
   <pre class="body lvl2">${ORG.Utils.htmlEncode(setting.value) + "&nbsp;"}</pre>
  </li>`;

  const editTmpl = (setting = {"name": "", "value": ""}) => `<li class="border cf lvl1 inedit">
 <input type="text" class="lvl1" spellcheck="false" placeholder="setting name" value="${setting.name}"/>
 <textarea class="lvl2" spellcheck="false" placeholder="value">${setting.value}</textarea>
 ${ORG.Icons.icon(setting.name ? setting.default ? "reset" : "delete" : "")}${ORG.Icons.icon("close")}${ORG.Icons.icon("done")}
</li>`;

  const events = {
    "close": ($li) => {
      const setting = $li.data("item");

      if (setting) {
        return $(itemTmpl(setting)).data("item", setting).replaceAll($li);
      }
      let $prev = $li.prev();
      if (!$prev[0]) $prev = $li.next();
      $li.remove();
      return $prev;
    },
    "delete": ($li) => {
      const setting = $li.data("item");
      const $orgpage = $li.closest(".orgpage").orgNotify({
        "grid": 1,
        "message": `Delete setting "${setting.name}"?`,
        "confirm": () => {
          try {
            if (ORG.Settings.deleteSetting(setting)) {
              const $prev = $li.prev();
              if ($prev[0]) $prev.cursor();
              else $li.next().cursor();
              $li.remove();
            }
          } catch (errorText) {
            $orgpage.orgNotify({"message": errorText});
          }
        },
        "rebind": () => bindKeyboard($orgpage) // eslint-disable-line no-use-before-define
      });
      return $();
    },
    "done": ($li) => {
      const oldSetting = $li.data("item");
      const newSetting = {
        "name": $li.find("input").val().trim(),
        "value": $li.find("textarea").val().trim(),
        "default": oldSetting ? oldSetting.default : false
      };

      try {
        if (ORG.Settings.saveSetting(newSetting, oldSetting)) {
          return $(itemTmpl(newSetting)).data("item", newSetting).replaceAll($li).cursor();
        }
      } catch (errorMessage) {
        $li.closest(".orgpage").orgNotify({"message": errorMessage});
      }
      return $();
    },
    "edit": ($li) => {
      $li.closest(".orgpage").find(".inedit .orgicon.close").click();
      const item = $li.data("item");
      return $(editTmpl(item)).data("item", item).replaceAll($li);
    },
    "reset": ($li) => {
      const $orgpage = $li.closest(".orgpage").orgNotify({
        "grid": 1,
        "message": `Reset to default "${$li.data("item").name}"?`,
        "confirm": () => {
          const setting = ORG.Settings.deleteSetting($li.data("item"));
          $(itemTmpl(setting)).data("item", setting).replaceAll($li).cursor();
        },
        "rebind": () => bindKeyboard($orgpage) // eslint-disable-line no-use-before-define
      });
      return $li;
    }
  };

  const bindKeyboard = ($orgpage) => ORG.Keyboard.bind({
    "n": ORG.Keyboard.common.cursorDown,
    "down": [ORG.Keyboard.common.cursorDown, {
      "delegate": "input",
      "fn": (ev) => $(ev.target).next().focus(),
    }],
    "p": ORG.Keyboard.common.cursorUp,
    "up": ORG.Keyboard.common.cursorUp,
    "f": ORG.Keyboard.common.cursorForward,
    "b": ORG.Keyboard.common.cursorBackward,
    "alt+<": ORG.Keyboard.common.cursorFirst,
    "alt+shift+<": ORG.Keyboard.common.cursorLast,
    "t": () => $(".orgactionbar .Theme", $orgpage).click(),
    "return": [() => events
      .edit($("#cursor", $orgpage))
      .cursor()
      .find("textarea").autoHeight().end()
      .find("input").textFocus(),
    {
      "delegate": "input",
      "fn": (ev) => $(ev.target).next().focus(),
    }],
    "esc": [() => $(".inedit .close", $orgpage).click(), {
      "delegate": "input,textarea",
      "fn": (ev) => $(ev.target).siblings(".close").click(),
    }],
    "ctrl+return": [() => $orgpage.find(".orgnavbar .add").click(), {
      "delegate": "input,textarea",
      "fn": (ev) => $(ev.target).siblings(".done").click(),
    }],
    "shift+tab": () => $orgpage.find(".orgnavbar .cycle a").click(),
    "tab": () => {
      const $cursor = $("#cursor", $orgpage);
      return $cursor.hasClass("inedit") ? $cursor.find("input").focus() : $cursor.cycle();
    },
  });

  const init = ($orgpage) => {
    let textareaTimeout;
    bindKeyboard($orgpage);
    return $orgpage.on("click", "li:not(.inedit)", function () {
      $(this).cursor().cycle();
      return false;
    }).on("click", "pre", (ev) => {
      $(ev.target).closest("li").cursor();
      return false;
    }).on("click", ".orglist .orgicon", function () {
      const $li = $(this).closest("li");
      events[this.classList[1]]($li).cursor();
      return false;
    }).on("contextmenu", "li:not(.inedit)", function () {
      events.edit($(this)).cursor()
        .find("textarea").autoHeight().end()
        .find("input").textFocus();
      return false;
    }).on("input", "textarea", (ev) => {
      clearTimeout(textareaTimeout);
      textareaTimeout = setTimeout(() => $(ev.target).autoHeight(), 150);
    });
  };

  $.fn.orgSettings = function (settings) {
    const {ICONTYPE} = ORG.Icons;
    const $orgSettings = init(this.removeData().off().empty().append(
      $(document.createElement("div")).orgNavbar({
        "org": {"type": ICONTYPE.ICON, "fn": "#"},
        "back": {"type": ICONTYPE.ICON, "fn": () => history.back()},
        "title": {"type": "Settings"},
        "add": {
          "type": ICONTYPE.ICON,
          "fn": () => {
            this.find(".inedit .orgicon.close").click();
            $(editTmpl()).appendTo(this.find(".orglist")).cursor().find("input").focus();
          }
        },
        "cycle": {
          "type": ICONTYPE.ICON,
          "fn": () => {
            const $allLi = this.find(".orglist li");
            return $allLi[$allLi.first().hasClass("collapsed") ? "removeClass" : "addClass"]("collapsed");
          }
        },
        "reset": {
          "type": ICONTYPE.ICON,
          "fn": () => this.orgNotify({
            "message": "Reset all settings to default values?",
            "confirm": () => ORG.Settings.resetSettings() && this.orgSettings(ORG.Settings.getSettings()),
            "rebind": () => bindKeyboard(this)
          })
        },
      }).addClass("flex"),
      $(document.createElement("div")).orgNavbar({
        "Change Theme": {
          "type": ICONTYPE.TEXT,
          "fn": () => this.orgNotify({
            "grid": "grid",
            "items": [{
              "name": "Dark",
              "fn": () => {
                ORG.Store.setTheme();
                location.reload();
              }
            }, {
              "name": "Light",
              "fn": () => {
                ORG.Store.setTheme("light");
                location.reload();
              }
            }],
            "rebind": () => bindKeyboard(this)
          })
        }
      }).addClass("grid orgactionbar"),
      `<ul class="orglist orgview${ORG.Utils.isMobile ? " nocursor" : ""}">
      ${settings.map((setting) => itemTmpl(setting, true)).join("")}
      </ul>`));

    const $allLi = $orgSettings.find(".orglist>li").each(function (idx) {
      $(this).data("item", settings[idx]);
    });

    if (!ORG.Utils.isMobile) {
      $allLi.eq(0).cursor();
    }

    return $orgSettings;
  };
})();
