(() => {
  const {icon, ICONTYPE} = ORG.Icons;
  const {SyncStatus, SyncType} = ORG.Store;
  const {syncFile} = ORG.Sync;

  const itemTmpl = (file) => `<li class="border flex sync${file.sync.stat}">
  <a class="flex" href="#notes#${file.id}">
    ${icon(file.sync.type === SyncType.DBOX ? "dbox" : "file")}
    <span>${file.name}</span>
  </a>
  ${file.sync.type ? icon("sync") : ""}
</li>`;
  const editTmpl = (file = {"name": "", "sync": {"type": SyncType.LOCAL}}) => `<li class="border flex inedit">
  ${icon(file.sync.type === SyncType.DBOX ? "dbox" : "file")}
  <input type="text" spellcheck="false" placeholder="File Name" value="${file.name}"/>
  ${icon("done")}${icon("close")}${file.id ? icon("delete") : ""}
</li>`;

  const events = {
    "close": ($li) => {
      const file = $li.data("file");

      if (file) {
        return $(itemTmpl(file)).data("file", file).replaceAll($li);
      }
      let $prev = $li.prev();
      if (!$prev[0]) $prev = $li.next();
      $li.remove();
      return $prev;
    },
    "edit": ($li) => {
      $li.siblings(".inedit").find(".orgicon.close").click();
      const file = $li.data("file");
      return $(editTmpl(file))
        .data("file", file)
        .replaceAll($li);
    },
    "context": ($li) => {
      if ($li.find(".orgicon.sync")[0]) {
        const $orgpage = $li.closest(".orgpage");
        $orgpage.find(".inedit .orgicon.close").click();

        const updateFn = (stat, dml) => {
          const file = $li
            .removeClass((idx, className) => className.match(/sync[0-9]/))
            .addClass("sync" + SyncStatus.INSYNC)
            .data("file");
          file.sync.stat = stat;
          file.dml = dml;
          syncFile(
            file,
            (status) => $li.removeClass("sync" + SyncStatus.INSYNC).addClass("sync" + status),
            (message) => $li.removeClass("sync" + SyncStatus.INSYNC) &&
              $orgpage.orgNotify({"message": message})
          );
        };
        $orgpage.orgNotify({
          "items": [
            {
              "name": "Edit",
              "fn": () => events
                .edit($li)
                .find("input[type=text]")
                .textFocus()
            },
            {
              "name": "Sync Force Local File",
              "fn": () => updateFn(SyncStatus.MODIFIED, Infinity)
            },
            {
              "name": "Sync Force Server File",
              "fn": () => updateFn(SyncStatus.SYNC, 0)
            },
          ],
          "rebind": () => bindKeyboard($orgpage) // eslint-disable-line no-use-before-define
        });
        return $li;
      }
      return events.edit($li);
    },
    "delete": ($li) => {
      const $orgpage = $li.closest(".orgpage");
      const file = $li.data("file");
      $orgpage.orgNotify({
        "message": "Delete file \"" + file.name + "\"?",
        "confirm": () => {
          try {
            if (ORG.Store.deleteFile(file.id)) {
              const $prev = $li.prev();
              ($prev[0] ? $prev : $li.next()).cursor();
              if (!$li.siblings().length) {
                $li.parent().append(
                  "<div class='orgnotice'><br/>There aren't any org files<br/><br/>Create new file by clicking on + icon</div>"
                );
              }
              $li.remove();
            }
          } catch (errorMessage) {
            $orgpage.orgNotify({"message": errorMessage});
          }
        },
        "rebind": () => bindKeyboard($orgpage) // eslint-disable-line no-use-before-define
      });
      return $();
    },
    "done": ($li) => {
      let file = $li.data("file");
      const name = $li.find("input[type=text]").val();

      try {
        if (file) { // update
          file.name = name;
          file = ORG.Store.updateFile(file);
        } else { // new file
          file = ORG.Store.createFile(name);
        }
        $li.closest(".orgpage").find(".orgnotice").remove();
        return $(itemTmpl(file)).data("file", file).replaceAll($li);
      } catch (errorMessage) {
        $li.closest(".orgpage").orgNotify({"message": errorMessage});
      }
      return $();
    },
    "sync": ($li) => {
      const clss = $li.attr("class");
      const file = $li
        .removeClass((idx, className) => className.match(/sync[0-9]/))
        .addClass("sync" + SyncStatus.INSYNC)
        .data("file");
      ORG.Sync.syncFile(
        file,
        (status) => {
          try {
            file.sync.stat = status;
            if (ORG.Store.updateFile(file)) {
              $li.removeClass("sync" + SyncStatus.INSYNC).addClass("sync" + status);
            }
          } catch (errorMessage) {
            $li.closest(".orgpage").orgNotify({"message": errorMessage});
          }
        },
        (message) => $li.attr("class", clss).closest(".orgpage").orgNotify({"message": message}));
      return $();
    }
  };

  const gotoFile = ($orgpage) => {
    const $cursor = $orgpage.find("#cursor a");
    return $cursor[0] ? $cursor[0].click() : false;
  };

  const bindKeyboard = ($orgpage) => ORG.Keyboard.bind(Object.assign({
    "a": "#agenda#a",
    "m": () => $orgpage.find(".orgnavbar.grid .orgicon:nth-child(2)").click(),
    "s": () => $orgpage.find(".orgnavbar.grid .orgicon:nth-child(3)").click(),
    "alt+s": "#settings",
    "ctrl+return": () => $orgpage.find(".orgnavbar .add").click(),
    "e": () => events.edit($orgpage.find("#cursor")).find("input[type=text]").textFocus(),
    "esc": [() => $orgpage.find(".inedit .close a").click(), {
      "delegate": "input",
      "fn": (ev) => $(ev.target).siblings(".close").click(),
    }],
    "r": () => $orgpage.find("#cursor .orgicon.sync").click(),
    "shift+r": () => $orgpage.find(".orgfiles .orgicon.sync").click(),
    "return": [() => gotoFile($orgpage), {
      "delegate": "input",
      "fn": (ev) => $(ev.target).siblings(".done").click(),
    }],
    "tab": () => gotoFile($orgpage),
    "n": ORG.Keyboard.common.cursorDown,
    "down": ORG.Keyboard.common.cursorDown,
    "p": ORG.Keyboard.common.cursorUp,
    "up": ORG.Keyboard.common.cursorUp,
    "alt+<": ORG.Keyboard.common.cursorFirst,
    "alt+shift+<": ORG.Keyboard.common.cursorLast,
  }, Object.keys(ORG.Settings.getCustomAgendas()).reduce((agendas, key) => {
    agendas[key] = "#agenda#" + key;
    return agendas;
  }, {})));

  const init = ($orgpage) => {
    bindKeyboard($orgpage);
    return $orgpage.on("click", ".orgfiles .orgicon", function () {
      events[this.classList[1]]($(this).closest("li")).cursor();
      return false;
    }).on("contextmenu", "li:not(.inedit)", (ev) => {
      events.context($(ev.target).closest("li"))
        .cursor()
        .find("input[type=text]").textFocus();
      return false;
    });
  };

  $.fn.orgFiles = function (fileList = []) {
    const customAgendas = ORG.Settings.getCustomAgendas();
    return init(this.removeData().off().empty().append(

      $(document.createElement("div")).orgNavbar({
        "org": {"type": ICONTYPE.ICON, "fn": "#"},
        "back": {"type": ICONTYPE.ICON, "fn": () => history.back()},
        "title": {"type": "Org"},
        "github": {"type": ICONTYPE.ICON, "fn": "https://github.com/borablanca/orgmodeweb"},
        "add": {
          "type": ICONTYPE.ICON,
          "fn": () => this.orgNotify({
            "grid": "grid",
            "items": [{
              "name": "Local File",
              "fn": () => {
                const $orgFiles = this.find(".orgfiles");
                $orgFiles.find(".inedit .orgicon.close").click();
                $(editTmpl()).cursor().appendTo($orgFiles).find("input[type=text]").focus();
              }
            }, {
              "name": "From Dropbox",
              "fn": "#dbox#"
            }],
            "rebind": () => bindKeyboard(this)
          })
        },
        "settings": {"type": ICONTYPE.ICON, "fn": "#settings"},
        "sync": {
          "type": ICONTYPE.ICON,
          "fn": () => this.find(".orgfiles .orgicon.sync").click()
        },
      }).addClass("flex"),

      $(document.createElement("div")).orgNavbar(
        Object.assign(
          {
            "Agenda": {"type": ICONTYPE.TEXT, "fn": "#agenda#a"},
            "Match": {
              "type": ICONTYPE.TEXT, "fn": () => {
                this.orgNotify({
                  "message": "Match Query:",
                  "prompt": 1,
                  "confirm": (query) => ORG.route("#search#m#" + query),
                  "rebind": () => bindKeyboard(this)
                });
              }
            },
            "Search": {
              "type": ICONTYPE.TEXT, "fn": () => {
                this.orgNotify({
                  "message": "Search:",
                  "prompt": 1,
                  "confirm": (text) => ORG.route("#search#s#" + text),
                  "rebind": () => bindKeyboard(this)
                });
              }
            },
          },
          Object.keys(customAgendas).reduce((agendaObj, key) => {
            agendaObj[key === "a" ? "Agenda" : customAgendas[key][0].header || "Agenda " + key] = {
              "type": ICONTYPE.TEXT,
              "fn": "#agenda#" + key
            };
            return agendaObj;
          }, {})
        )
      ).addClass("grid"),

      fileList.length ?
        $(document.createElement("ul")).addClass(`orgfiles orglist${ORG.Utils.isMobile ? " nocursor" : ""}`).append(
          fileList.map((file) => $(itemTmpl(file)).data("file", file))
        ).find("li:first-child").cursor().end() :
        "<ul class='orgfiles orglist'/><div class='orgnotice'><br/>There aren't any org files<br/><br/>Create new file by clicking on + icon</div>"
    ));
  };
})();
