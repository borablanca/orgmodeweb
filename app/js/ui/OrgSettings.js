(() => {
  const itemTmpl = (setting, collapsed = false) => `
  <li class="${collapsed ? "collapsed " : ""}lvl1" data-setting="${setting.name}" data-lvl="1">
   <span class="title">${setting.name}</span>
   <pre class="body lvl2">${setting.value}</pre>
  </li>`;

  const editTmpl = (setting = { "name": "", "value": "" }) => `<li class="border cf lvl1 inedit">
 <input type="text" class="lvl1" spellcheck="false" placeholder="setting name" value="${setting.name}"/>
 <textarea class="lvl2" spellcheck="false" placeholder="value">${setting.value}</textarea>
 ${ORG.Icons.icon(setting.name ? setting.default ? "reset" : "delete" : "")}${ORG.Icons.icon("close")}${ORG.Icons.icon("done")}
</li>`;

  const init = ($container) => {
    let textareaTimeout;
    const events = {
      "close": ($li) => {
        const setting = $li.data("item");

        if (setting) {
          return $(itemTmpl(setting)).data("item", setting).replaceAll($li);
        }
        const $prev = $li.prev();
        if (!$prev[0]) $prev = $li.next();
        $li.remove();
        return $prev;
      },
      "delete": ($li) => {
        const setting = $li.data("item");
        $li.closest(".orgpage")
          .orgNotify({
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
                this.closest(".orgpage").orgNotify({ "message": errorText });
              }
            }
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
          $li.closest(".orgpage").orgNotify({ "message": errorMessage });
        }
        return $();
      },
      "edit": ($li) => {
        $li.closest(".orgpage").find(".inedit .orgicon.close").click();
        const item = $li.data("item");
        return $(editTmpl(item)).data("item", item).replaceAll($li);
      },
      "reset": ($li) => $li.closest(".orgpage").orgNotify({
        "grid": 1,
        "message": `Reset to default "${$li.data("item").name}"?`,
        "confirm": () => {
          const setting = ORG.Settings.deleteSetting($li.data("item"));
          $(itemTmpl(setting)).data("item", setting).replaceAll($li).cursor();
        }
      }),
    };

    /*
     * if (!$.isMobile()) {
     *   $(document).orgKeyboard({
     *     "return": [() => events.edit($container.find(".select")), {
     *       "delegate": "input",
     *       "fn": (ev) => $(ev.target).next().focus().moveCaret().trigger("keydown"),
     *     }],
     *     "esc": [() => $container.find(".select.edit .close").click(), {
     *       "delegate": "input,textarea",
     *       "fn": (ev) => $(ev.target).siblings(".close").click(),
     *     }],
     *     "ctrl+return": [() => $container.find(".orgnavbar .add").click(), {
     *       "delegate": "input,textarea",
     *       "fn": (ev) => $(ev.target).siblings(".done").click(),
     *     }],
     *     "shift+tab": () => $container.find(".orgnavbar .cycle").click(),
     *     "tab": () => {
     *       const $selected = $container.find(".select");
     *       return $selected.hasClass("edit") ? $selected.find("input").focus() : $selected.toggleClass("collapsed");
     *     },
     *     "n": () => $container.find(".select").move(),
     *     "down": [() => $container.find(".select").move(), {
     *       "delegate": "input",
     *       "fn": (ev) => $(ev.target).next().focus(),
     *     }],
     *     "p": () => $container.find(".select").move("prev"),
     *     "up": () => $container.find(".select").move("prev"),
     *   });
     * } else {
     */
    return $container.on("click", "li:not(.inedit)", function () {
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
    const { ICONTYPE } = ORG.Icons;
    const $orgSettings = init(this.removeData().off().empty().append(
      $(document.createElement("div")).orgNavbar({
        "org": { "type": ICONTYPE.ICON, "fn": "#" },
        "back": { "type": ICONTYPE.ICON, "fn": () => history.back() },
        "title": { "type": "Settings" },
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
          })
        },
      }).addClass("flex"),
      $(document.createElement("div")).orgNavbar({
        "Change Theme": () => { }
      }).addClass("grid"),
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
