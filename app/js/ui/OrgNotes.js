(() => {
  const writeTimestamp = ORG.Writer.writeTimestamp;

  const settingTmpl = (setting, value) =>
    (setting !== "text" && setting !== "fileName") ? `<pre>${"#+" + setting + ": " + value}</pre>` : "";

  const itemTmpl = (node, settings) =>
    `<li data-lvl="${node.lvl}" class="lvl-${node.lvl % 3}${node.tags && node.tags.match(ORG.Parser.archiveRE) ? " archive" : ""}" style="padding-left:${(node.lvl - 1) * 15 + 5}px">
      <span class="title">
        ${node.todo ? `<span class="todo todo-${node.todo}">${node.todo}</span>` : ""}
        ${node.pri ? `<span class="pri">[#${node.pri}]</span>` : ""}
        ${node.title ? `<span>${$.markup(node.title)}</span>` : ""}
        ${node.tags ? `<span class="tags">${node.tags}</span>` : ""}
      </span>
      <div class="body">
        ${node.cls ? `<div class="cls">CLOSED: <span class="ts">${writeTimestamp(node.cls, true)}</span></div>` : ""}
        ${node.dl ? `<div class="dl">DEADLINE: <span class="ts">${writeTimestamp(node.dl)}</span></div>` : ""}
        ${node.sch ? `<div class="sch">SCHEDULED: <span class="ts">${writeTimestamp(node.sch)}</span></div>` : ""}
        ${node.props ? `<div class="props collapsible collapsed">
        <div>:PROPERTIES:</div>
        ${Object.keys(node.props).map((key) => `<div><span>:${key}: </span><span>${$.markup(node.props[key])}</span></div>`).join("")}
        <div>:END:</div>
      </div>` : ""}
      ${node.logbook ? `<div class="collapsible collapsed">
        <div>:LOGBOOK:</div>
          <pre class="txt">${node.logbook.map((log) => $.markup(log)).join("\n")}</pre>
        <div>:END:</div>
      </div>` : ""}
      ${node.text ? `<pre class="txt">${$.markup(node.text)} </pre>` : ""}
    </div>
  </li>`;

  const itemEditTmpl = (node, settings) => {
    let todoTxt = (node.todo ? node.todo + " " : "") + (node.pri ? (`[#${node.pri}] `) : "");
    let bodyTxt = "";
    if (node.cls) bodyTxt += `CLOSED: ${writeTimestamp(node.cls)}\n`;
    if (node.sch) bodyTxt += `SCHEDULED: ${writeTimestamp(node.sch)}\n`;
    if (node.dl) bodyTxt += `DEADLINE: ${writeTimestamp(node.dl)}\n`;
    if (node.props) bodyTxt += ":PROPERTIES:\n" + Object.keys(node.props).map((key) => `:${key}: ${node.props[key]}`).join("\n") + "\n:END:\n";
    if (node.logbook) bodyTxt += ":LOGBOOK:\n" + node.logbook.join("\n") + "\n:END:\n";
    if (node.text) bodyTxt += node.text;
    return `<li data-lvl="${node.lvl}" class="edit lvl-${node.lvl % 3}" style="padding-left:${(node.lvl - 1) * 15 + 5}px">
      <input type="text" value="${todoTxt + node.title + (node.tags ? ("  " + node.tags) : "")}"/>
      <textarea rows="1">${bodyTxt}</textarea>
      ${ORG.icon("done")}${ORG.icon("close")}${ORG.icon("delete")}
    </li>`;
  };

  $.fn.refresh = function(settings, newData) {
    let data = newData || this.data("node");
    return $((this.hasClass("edit") ? itemEditTmpl : itemTmpl)(data, settings))
      .data("node", data).replaceAll(this.removeData());
  };

  const init = ($container, settings) => {
    let events = {
      close: ($li) => $li.hasClass("new") ? $li.remove() : $li.removeClass("edit").refresh().mark(),
      delete: ($li) => $container.orgNotify({
        content: "Delete note?",
        confirm: () => events.save($li.removeData().remove()),
      }),
      done: ($li) => {
        let data = $li.data("node") || {lvl: 1};
        let bodyTxt = $li.find("textarea").val();
        let txt = `${"*".repeat(data.lvl)} ${$li.find("input").val()}${bodyTxt.length ? "\n" + bodyTxt : ""}`;
        $li.removeClass("edit").refresh(settings, ORG.Parser.parse("", txt, settings)[1]).mark();
        $container.find(".orgnavbar").removeClass("sync");
        return events.save();
      },
      edit: ($li) => {
        let data = $li.data("node");
        return $(itemEditTmpl(data, settings))
          .data("node", data)
          .replaceAll($li.removeData()).mark()
          .find("input").focus().end()
          .find("textarea").autoHeight();
      },
      context: ($li, noedit) => {
        let $allA = $li.mark().find("a");
        $allA[0] ? $container.orgContext((noedit ? [] : [{
          name: "Edit",
          fn: () => events.edit($li),
        }]).concat($.map($allA, ((a) => ({
          name: "Goto Link: " + a.text,
          fn: () => ORG.route(a.href),
        })))), () => $container.find(".select").scrollTo()) :
          !noedit && events.edit($li);
        return false;
      },
      save: () => {
        let fname = $container.find(".orgnavbar span").text();
        try {
          let allText = $.map($(".notesettings pre"), (pre) => pre.textContent);
          allText = allText.slice(0, allText.length - 1).join("\n") + (allText[allText.length - 1] || "");
          return ORG.Store.setFile(fname,
            [ORG.Parser.parse(fname, allText, settings)[0]]
              .concat($.map($container.find(".orgnotes>li"), (k) => $(k).data("node"))),
            fname);
        } catch (e) {
          return $container.orgNotify({content: e});
        }
      },
      editLvl: ($li, increase) => $li.map((idx, curLi) => {
        let $curLi = $(curLi);
        let data = $curLi.data("node");
        return $curLi.refresh(settings, ORG.Data.set(data, {lvl: increase ? data.lvl + 1 : Math.max(data.lvl - 1, 1)}));
      }).get(0),
    };

    $(document).orgKeyboard({
      "shift+tab": () => $container.find(".orgnavbar .cycle").click(),
      "tab": [{
        delegate: "textarea",
        fn: (ev) => false,
      }, () => {
        let $selected = $container.find(".select");
        return $selected.hasClass("edit") ? $selected.find("input").focus().moveCaret(1) : $selected.cycle();
      }],
      "ctrl+l": () => $container.find(".select").scrollTo(),
      "ctrl+return": [() => $container.find(".orgnavbar .add").click(), {
        delegate: "input,textarea",
        fn: (ev) => $(ev.target).siblings(".done").click() && events.save(),
      }],
      "o": () => events.context($container.find(".select"), 1),
      "return": [() => events.edit($container.find(".select")), {
        delegate: "input",
        fn: (ev) => $(ev.target).next().focus(),
      }],
      "esc": [() => $container.find(".select.edit .close").click(), {
        delegate: "input,textarea",
        fn: (ev) => $(ev.target).siblings(".close").click(),
      }],
      "n": () => $container.find(".select").move(),
      "down": [() => $container.find(".select").move(), {
        delegate: "input",
        fn: (ev) => $(ev.target).next().focus(),
      }],
      "p": () => $container.find(".select").move("prev"),
      "up": () => $container.find(".select").move("prev"),
      "f": () => $container.find(".select").move("next", 1),
      "b": () => $container.find(".select").move("prev", 1),
      "u": () => {
        let $selected = $container.find(".select");
        let lvl = $selected.data("node").lvl;
        while (($selected = $selected.prev()) && $selected[0] && $selected.data("node").lvl + 1 !== lvl);
        return $selected.mark();
      },
      "alt+<": () => $container.find(".orgnotes>li").first().mark(),
      "alt+shift+<": () => $container.find(".orgnotes>li").last().mark(),
      "alt+left": [() => events.save(events.editLvl($container.find(".select")).mark()), {
        delegate: "input,textarea",
        fn: (ev) => events.editLvl($(ev.target).closest("li")).find("input").select(),
      }],
      "alt+right": [() => events.save(events.editLvl($container.find(".select"), 1).mark()), {
        delegate: "input,textarea",
        fn: (ev) => events.editLvl($(ev.target).closest("li"), 1).find("input").select(),
      }],
      "alt+shift+left": () => {
        let $selected = $container.find(".select");
        let lvl = $selected.data("node").lvl;
        let $next = $selected;
        while (($next = $next.next()) && $next[0] && $next.data("node").lvl > lvl) $selected = $selected.add($next);
        events.save(events.editLvl($selected).mark());
      },
      "alt+shift+right": () => {
        let $selected = $container.find(".select");
        let lvl = $selected.data("node").lvl;
        let $next = $selected;
        while (($next = $next.next()) && $next[0] && $next.data("node").lvl > lvl) $selected = $selected.add($next);
        events.save(events.editLvl($selected, 1).mark());
      },
      "t": () => {
        let setFn = (val) => {
          let $selected = $container.find(".select");
          $selected.refresh(settings, ORG.Data.set($selected.data("node"), {todo: val})).mark();
          events.save();
          return false;
        };
        $container.orgContext([{name: "None", fn: setFn}].concat(
          Object.keys(settings["todo-faces"]).map((todo) => ({name: todo, fn: () => setFn(todo)}))),
        () => $container.find(".select").scrollTo());
        return false;
      },
    });
    $.isMobile() && $container.on("contextmenu", "li:not(.edit)", function() {
      events.context($(this));
      return false;
    });
    return $container.on("click", "li:not(.edit)", function() {
      $(this).mark().cycle();
      return false;
    }).on("click", ".body", function() {
      $(this).closest("li").mark();
      return false;
    }).on("click", ".orgicon", function() {
      events[this.classList[1]]($(this).closest("li"));
      return false;
    }).on("click", ".collapsible div:first-child", function() {
      $(this).parent().toggleClass("collapsed");
    }).on("input", "textarea", (ev) => $(ev.target).autoHeight());
  };

  $.fn.orgNotes = function(fileName, nodeId = 1) {
    if (!fileName) return this;
    let settings = ORG.Settings.getSettings();
    let nodes = ORG.Store.getFile(fileName, settings);
    let settingsNode = nodes[0];
    let curSettings = {
      "todo-faces": ORG.Settings.getTodoFaces(settings),
      "todo-keywords": ORG.Settings.getTodoKeywords(settings, settingsNode),
    };
    let tabState = 0;
    let fileSync = ORG.Store.getFileNames()[fileName].sync;
    let fileSyncClass = !fileSync ? "sync" : (fileSync === ORG.Dropbox.SYNC.CONFLICT ? "conflict" : "");
    return init(this.removeData().off().empty().append(
      ORG.Settings.getStyles(curSettings),
      $(document.createElement("div")).addClass(fileSyncClass).orgNavbar({
        // edit: () => {
        //   let $selected = this.find(".select");
        //   let data = $selected.data("node");
        //   return $(itemEditTmpl(data, settings))
        //     .data("node", data)
        //     .replaceAll($selected.removeData())
        //     .find("input").select().end()
        //     .find("textarea").trigger("keydown");
        // },
        add: () => {
          let $prev = this.find(".select");
          if (!$prev[0]) {
            $(itemEditTmpl({lvl: 1, title: ""}))
              .appendTo(this.find(".orgnotes"))
              .find("input").select();
          } else {
            let lvl = $prev.data("node").lvl;
            let $next = $prev.next();
            while ($next[0] && $next.data("node").lvl > lvl) {
              $prev = $next;
              $next = $next.next();
            }
            let data = {lvl: lvl, title: ""};
            $(itemEditTmpl(data))
              .addClass("new")
              .data("node", data)
              .insertAfter($prev)
              .scrollTo()
              .find("input").select();
          }
        },
        cycle: () => {
          let $allLi = this.find(".orgnotes>li");
          if (!tabState) {
            $allLi.addClass("collapsed").filter(function() {
              return $(this).data("node").lvl > 1;
            }).hide();
            tabState++;
          } else if (tabState === 1) {
            $allLi.removeClass("collapsed").filter(function() {
              return $(this).data("node").lvl === 2;
            }).addClass("collapsed").show();
            tabState++;
          } else {
            $allLi.removeClass("collapsed").show();
            tabState = 0;
          }
          return false;
        },
        sync: () => {
          let fileNames = ORG.Store.getFileNames();
          if (fileNames[fileName].dbox) {
            this.prepend("<div class='orgloading'/>");
            ORG.Dropbox.syncFile(fileName, fileNames[fileName], (status) => {
              if (status === ORG.Dropbox.SYNC.CONFLICT) {
                this.remove(".orgloading").find(".orgnavbar").addClass("conflict");
              } else this.orgNotes(fileName, nodeId);
            }, () => this.orgNotify("Connection Error").remove(".orgloading"));
          }
        },
        title: fileName,
      }),
      `<div class="notesettings">
        ${Object.keys(settingsNode).map((key) => settingTmpl(key, settingsNode[key])).join("")}
        ${settingsNode.text ? `<pre>${settingsNode.text}</pre>` : ""}
      </div>`,
      $(document.createElement("ul")).addClass("orgnotes orgview").append(
        nodes.slice(1).map((node) => $(itemTmpl(node, curSettings)).data("node", node))
      )), curSettings).find(`.orgnotes>li:nth-child(${nodeId})`).mark().end();
  };
})();
