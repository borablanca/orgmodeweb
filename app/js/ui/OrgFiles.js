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

  const init = ($container) => {
    /*
     * const gotoFile = () => $orgpage.find(".cursor a")[0].click();
     */
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
            ]
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
          }
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

    /*
     * if (!ORG.Utils.isMobile()) {
     *   $(document).orgKeyboard({
     *     "alt+s": "#settings",
     *     "ctrl+return": () => $container.find(".orgnavbar .add").click(),
     *     "e": () => events.context($container.find(".select")),
     *     "esc": [() => $container.find(".select.edit .close").click(), {
     *       "delegate": "input",
     *       "fn": (ev) => $(ev.target).siblings(".close").click(),
     *     }],
     *     "r": () => {
     *       const $li = $container.find(".select:not(.edit)");
     *       return $li[0] && events.sync($li, ORG.Store.getFileNames()[$li.data("filename")]);
     *     },
     *     "shift+r": () => $container.find("li:not(.edit)").map((i, li) => {
     *       const $li = $(li);
     *       events.sync($li, ORG.Store.getFileNames()[$li.data("filename")]);
     *     }),
     *     "return": [gotoFile, {
     *       "delegate": "input",
     *       "fn": (ev) => $(ev.target).siblings(".done").click(),
     *     }],
     *     "tab": () => {
     *       const $selected = $container.find(".select");
     *       return $selected.hasClass("edit") ? $selected.find("input").focus() : gotoFile();
     *     },
     *     "n": () => $container.find(".select").move(),
     *     "down": () => $container.find(".select").move(),
     *     "p": () => $container.find(".select").move("prev"),
     *     "up": () => $container.find(".select").move("prev"),
     *     "alt+<": () => $container.find(".orgfiles>li").first().mark(),
     *     "alt+shift+<": () => $container.find(".orgfiles>li").last().mark(),
     *   }, 1);
     * }
     */
    return $container.on("click", ".orgfiles .orgicon", function () {
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
            }]
          }, null, ORG)
        },
        "settings": {"type": ICONTYPE.ICON, "fn": "#settings"},
        "sync": {"type": ICONTYPE.ICON, "fn": () => this.find(".orgfiles .orgicon.sync").click()},
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
                  "confirm": (query) => ORG.route("#search#m#" + query)
                });
              }
            },
            "Search": {
              "type": ICONTYPE.TEXT, "fn": () => {
                this.orgNotify({
                  "message": "Search:",
                  "prompt": 1,
                  "confirm": (text) => ORG.route("#search#s#" + text)
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
