/* eslint-disable max-lines */
(() => {
  const {writeTimestamp} = ORG.Writer;
  const {parseDrawers} = ORG.Parser;
  const {archiveRE} = ORG.Searcher;
  const {icon, ICONTYPE} = ORG.Icons;
  const {markup} = ORG.Utils;

  const itemBodyTmpl = (node) => {
    const propKeys = Object.keys(node.PROPS);
    const days = ORG.Settings.getDayNames();
    return `<div class="body">
  ${node.CLOSED ? `<div class="cls">CLOSED: <span class="ts">${writeTimestamp(node.CLOSED, days, 1)}</span></div>` : ""}
  ${node.DEADLINE ? `<div class="dl">DEADLINE: <span class="ts">${writeTimestamp(node.DEADLINE, days)}</span></div>` : ""}
  ${node.SCHEDULED ? `<div class="sch">SCHEDULED: <span class="ts">${writeTimestamp(node.SCHEDULED, days)}</span></div>` : ""}
  ${propKeys.length ? `<div class="props collapsed">
  <div class="collapsible">:PROPERTIES:</div>
  ${propKeys.map((key) => `<div><span class="lvl2">:${key}: </span><span>${markup(node.PROPS[key])}</span></div>`).join("")}
  <div class="orgdim">:END:</div></div>` : ""}
  ${node.TEXT.length ? `<pre class="txt">${parseDrawers(node.TEXT)}</pre>` : ""}</div>`;
  };

  const itemTmpl = (node, body = 1, collapsed = 0) => `<li class="${collapsed ? "collapsed " : ""}${body ? "orgupdated " : ""}lvl${node.LVL % 3}${archiveRE.test(node.TAGS) ? " orgarchive" : ""}" style="padding-left:${(node.LVL - 1) * 15 + 24}px" data-lvl="${node.LVL}">
  <div class="title">${node.TODO ? `<span class="orgtodo ${node.TODO}">${node.TODO} </span>` : ""}${node.PRI ? `<span class="pri">[#${node.PRI}] </span>` : ""}${node.TITLE ? `<span>${markup(node.TITLE)}</span>` : ""}${node.TAGS ? `<span class="tag">${markup(node.TAGS)}</span>` : ""}</div>
  ${body ? `<div class="body">${itemBodyTmpl(node)}</div>` : ""}
  </li>`;

  const editTmpl = (node = {"LVL": 1, "PROPS": {}, "TEXT": []}) => {
    const days = ORG.Settings.getDayNames();
    const todoTxt = (node.TODO ? `${node.TODO} ` : "") + (node.PRI ? `[#${node.PRI}] ` : "");
    let bodyTxt = "";
    if (node.CLOSED) bodyTxt += `CLOSED: ${writeTimestamp(node.CLOSED, days, 1)}\n`;
    if (node.SCHEDULED) bodyTxt += `SCHEDULED: ${writeTimestamp(node.SCHEDULED, days)}\n`;
    if (node.DEADLINE) bodyTxt += `DEADLINE: ${writeTimestamp(node.DEADLINE, days)}\n`;
    if (Object.keys(node.PROPS).length) bodyTxt += `:PROPERTIES:\n${Object.keys(node.PROPS).map((key) => `:${key}: ${node.PROPS[key]}`).join("\n")}\n:END:\n`;
    if (node.TEXT.length) bodyTxt += node.TEXT.join("\n");
    return `<li class="lvl${node.LVL % 3} border cf inedit" style="padding-left:${(node.LVL - 1) * 15 + 24}px" data-lvl="${node.LVL}">
 <input type="text" spellcheck="false" placeholder="note heading" value="${todoTxt + node.TITLE + (node.TAGS ? `    ${node.TAGS}` : "")}"/>
 <textarea spellcheck="false" placeholder="note body" rows="1">${bodyTxt}</textarea>
 ${node.TITLE ? icon("delete") : ""}${icon("close") + icon("done")}
</li > `;
  };
  const bufferTextTmpl = (node) => `<li class="orgbuffertext"><pre>${node.TEXT ? markup(node.TEXT) : ""}<br></pre></li>`;

  const editBufferTextTmpl = (node) => `
  <li class="orgbuffertext cf">
   <textarea>${node.TEXT}</textarea>
   ${icon("close")}${icon("done")}
  </li>`;

  const updateHeadingBody = ($li) => {
    if (!$li.hasClass("orgupdated")) {
      $li.addClass("orgupdated").append(itemBodyTmpl($li.data("node")));
      for (
        let lvl = $li.data("lvl"), $next = $li.next(), nlvl = $next.data("lvl");
        nlvl > lvl;
        $next = $next.next(), nlvl = $next.data("lvl")
      ) {
        if (!$next.hasClass("orgupdated")) {
          $next.addClass("orgupdated").append(itemBodyTmpl($next.data("node")));
        }
      }
    }
    return $li;
  };

  const events = {
    "close": ($li) => {
      const node = $li.data("node");

      if (node) {
        return $(($li.hasClass("orgbuffertext") ? bufferTextTmpl : itemTmpl)(node))
          .data("node", node)
          .replaceAll($li);
      }
      let $newLi = $li.prev();
      $newLi = $newLi[0] ? $newLi : $li.next();
      $li.remove();
      return $newLi;
    },
    "context": ($li, noedit) => {
      const $allA = $li.find("a");

      if ($allA[0]) {
        $li.closest(".orgpage").orgNotify({
          "items": (noedit ? [] : [{
            "name": "Edit",
            "fn": () => events.edit($li)
              .cursor()
              .find("textarea").autoHeight().end()
              .find("input").focus(),
          }]).concat($.map($allA, (anchor) => ({
            "name": "Goto Link: " + anchor.text,
            "fn": () => ORG.route(anchor.href),
          })))
        });
        return $();
      } else if (!noedit) {
        return events.edit($li);
      }
      return $li;
    },
    "delete": ($li, $container) => {
      $container.orgNotify({
        "message": "Delete note?",
        "confirm": () => {
          const $prev = $li.prev();
          $li.remove();
          if (events.save($container)) {
            const $orgnotes = $container.find(".orgnotes");

            if (!$orgnotes.find("li")[1] && !$orgnotes.find(".orgnotice")[0]) {
              $orgnotes.after("<div class='orgnotice'><br/>Empty file. Add notes by clicking on + icon</div>");
            }
            $prev.cursor();
          } else {
            $li.insertAfter($prev);
          }
        },
      });
      return $();
    },
    "done": ($li, $container) => { // eslint-disable-line max-statements
      const nodeData = $li.data("node");
      const bodyTxt = $li.find("textarea").val();

      if ($li.hasClass("orgbuffertext")) {
        const node = {"TEXT": bodyTxt};
        $li.data("node", node);
        if (events.save($container)) {
          return $(bufferTextTmpl(node)).data("node", node).replaceAll($li);
        }
        $li.data("node", nodeData);
        return $();
      }
      const node = ORG.Parser.parseFile(
        "",
        `${"*".repeat(nodeData ? nodeData.LVL : 1)} ${$li.find("input").val().trim()}${bodyTxt.length ? "\n" + bodyTxt : ""} `,
        $container.data("settings")
      )[0];
      $li.data("node", node);

      if (events.save($container)) {
        $container.find(".orgnotice").remove();
        return $(itemTmpl(node)).data("node", node).replaceAll($li);
      }
      $li.data("node", nodeData);
      return $();
    },
    "edit": ($li) => {
      $li.closest(".orgnotes").find(".orgicon.close").click();
      const node = $li.data("node");
      return $(($li.hasClass("orgbuffertext") ? editBufferTextTmpl : editTmpl)(node))
        .data("node", node)
        .replaceAll($li);
    },
    "save": ($container) => {
      let file = $container.data("file");

      try {
        file.sync.stat = ORG.Store.SyncStatus.MODIFIED;
        file = ORG.Store.updateFile(file, Object.assign(
          $.map($container.find(".orgnotes>li").slice(1), (li) => $(li).data("node")),
          ORG.Parser.parseFile(
            file.name,
            $(".orgbuffertext").data("node").TEXT,
            $container.data("settings")
          )
        ));
        return file ? $container
          .data("file", file)
          .find(".orgnavbar h1")
          .removeClass((idx, className) => className.match(/sync[0-9]/))
          .addClass("sync" + ORG.Store.SyncStatus.MODIFIED) : false;
      } catch (errorMessage) {
        $container.orgNotify({"message": errorMessage});
        return false;
      }
    },
    "show": ($li) => $li.find(".collapsible").removeClass("collapsed"),
  };

  const init = ($container) => {
    let textareaTimeout;

    /*
     * if (!$.isMobile()) {
     *   $(document).orgKeyboard({
     *     "shift+tab": () => $container.find(".orgnavbar .cycle").click(),
     *     "tab": [{
     *       "delegate": "textarea",
     *       "fn": (ev) => false,
     *     }, () => {
     *       const $selected = $container.find(".select");
     *       return $selected.hasClass("edit") ? $selected.find("input").focus().moveCaret(1) : $selected.cycle();
     *     }],
     *     "ctrl+l": () => $container.find(".select").scrollTo(),
     *     "ctrl+return": [() => $container.find(".orgnavbar .add").click(), {
     *       "delegate": "input,textarea",
     *       "fn": (ev) => $(ev.target).siblings(".done").click() && events.save($container),
     *     }],
     *     "o": () => events.context($container.find(".select"), settings, $container, 1),
     *     "return": [() => events.edit($container.find(".select"), settings, $container), {
     *       "delegate": "input",
     *       "fn": (ev) => $(ev.target).next().focus(),
     *     }],
     *     "esc": [() => $container.find(".select.edit .close").click(), {
     *       "delegate": "input,textarea",
     *       "fn": (ev) => $(ev.target).siblings(".close").click(),
     *     }],
     *     "n": () => $container.find(".select").move(),
     *     "down": [() => $container.find(".select").move(), {
     *       "delegate": "input",
     *       "fn": (ev) => $(ev.target).next().focus(),
     *     }],
     *     "p": () => $container.find(".select").move("prev"),
     *     "up": () => $container.find(".select").move("prev"),
     *     "f": () => $container.find(".select").move("next", 1),
     *     "b": () => $container.find(".select").move("prev", 1),
     *     "u": () => {
     *       let $selected = $container.find(".select");
     *       const lvl = $selected.data("node").lvl;
     *       while (($selected = $selected.prev()) && $selected[0] && $selected.data("node").lvl + 1 !== lvl);
     *       return $selected.mark();
     *     },
     *     "space": () => events.show($container.find(".select")),
     *     "alt+<": () => $container.find(".orgnotes>li").first().mark(),
     *     "alt+shift+<": () => $container.find(".orgnotes>li").last().mark(),
     *     "alt+left": [() => {
     *       events.editLvl($container.find(".select"), settings).mark();
     *       return events.save($container);
     *     }, {
     *       "delegate": "input,textarea",
     *       "fn": (ev) => events.editLvl($(ev.target).closest("li"), settings).find("input").select(),
     *     }],
     *     "alt+right": [() => {
     *       events.editLvl($container.find(".select"), settings, 1).mark();
     *       return events.save($container);
     *     }, {
     *       "delegate": "input,textarea",
     *       "fn": (ev) => events.editLvl($(ev.target).closest("li"), settings, $container, 1).find("input").select(),
     *     }],
     *     "alt+shift+left": () => {
     *       let $selected = $container.find(".select");
     *       const lvl = $selected.data("lvl");
     *       let $next = $selected;
     *       while (($next = $next.next()) && $next[0] && +$next.data("lvl") > lvl) $selected = $selected.add($next);
     *       events.editLvl($selected, settings).mark();
     *       events.save($container);
     *     },
     *     "alt+shift+right": () => {
     *       let $selected = $container.find(".select");
     *       const lvl = $selected.data("lvl");
     *       let $next = $selected;
     *       while (($next = $next.next()) && $next[0] && +$next.data("lvl") > lvl) $selected = $selected.add($next);
     *       events.editLvl($selected, settings, 1).mark();
     *       events.save($container);
     *     },
     *     "alt+up": () => {
     *       const $selected = $container.find(".select");
     *       const $prev = $selected.prev();
     *       $prev[0] && $selected.after($prev);
     *       events.save($container);
     *     },
     *     "alt+down": () => {
     *       const $selected = $container.find(".select");
     *       const $next = $selected.next();
     *       $next[0] && $selected.insertAfter($next);
     *       events.save($container);
     *     },
     *     "alt+shift+up": () => {
     *       let $selected = $container.find(".select");
     *       const lvl = $selected.data("lvl");
     *       let $next = $selected;
     *       let $prev = $selected.prev();
     *       const prevLvl = +$prev.data("lvl");
     */

    /*
     *       if (prevLvl >= lvl) {
     *         while (($next = $next.next()) && $next[0] && +$next.data("lvl") > lvl) $selected = $selected.add($next);
     *         if (prevLvl > lvl) {
     *           while (($prev = $prev.prev()) && $prev[0] && +$prev.data("lvl") > lvl);
     *         }
     *         $selected.insertBefore($prev);
     *       }
     *     },
     *     "alt+shift+down": () => {
     *       let $selected = $container.find(".select");
     *       let lvl = $selected.data("lvl");
     *       let $next = $selected;
     */

    /*
     *       if (+$next.next().data("lvl") >= lvl) {
     *         while (($next = $next.next()) && $next[0] && +$next.data("lvl") > lvl) $selected = $selected.add($next);
     *         if ($next[0]) {
     *           lvl = $next.data("lvl");
     *           let $nnext = $next;
     *           while (($nnext = $next.next()) && $nnext[0] && +$nnext.data("lvl") > lvl) $next = $nnext;
     *           $selected.insertAfter($next);
     *           events.save($container);
     *         }
     *       }
     *     },
     *     "t": () => $(".orgactionbar .todo").click(),
     *     ",": () => $(".orgactionbar .pri").click(),
     *     "g": () => $(".orgactionbar .tags").click(),
     *   });
     * }
     */
    return $container.on("click", "li:not(.inedit)", function () {
      const $this = $(this);
      $this.cursor();
      if (!$this.is(":first-child")) updateHeadingBody($this).cycle();
      return false;
    }).on("click", ".body", function () {
      $(this).closest("li").cursor();
      return false;
    }).on("click", ".orglist .orgicon", function () {
      events[this.classList[1]]($(this).closest("li"), $container).cursor();
      return false;
    }).on("click", ".collapsible", function () {
      $(this).parent().toggleClass("collapsed");
    }).on("contextmenu", "li:not(.inedit)", (ev) => {
      const $li = events.context($(ev.currentTarget)).cursor();

      if ($li.is(".orgbuffertext")) {
        $li.find("textarea").autoHeight().textFocus();
      } else {
        $li.find("textarea").autoHeight().end()
          .find("input[type=text]").textFocus();
      }
      return false;
    }).on("keydown", "textarea", (ev) => {
      clearTimeout(textareaTimeout);
      if (ev.which === 13) {
        $(ev.target).autoHeight();
      } else {
        textareaTimeout = setTimeout(() => $(ev.target).autoHeight(), 250);
      }
    });
  };

  $.fn.orgNotes = function (file, nodeId) {
    const nodes = ORG.Store.getFileHeadings(file.id, ORG.Settings.getSettingsObj());
    const $orgNotes = init(this.removeData().off().empty().data({
      "file": file,
      "settings": {
        "persistent-tags": nodes.TAGS,
        "priority-letters": nodes.PRIORITIES,
        "todo-keywords": nodes.TODO
      }
    }).append(
      $(document.createElement("div")).orgNavbar({
        "org": {"type": ICONTYPE.ICON, "fn": "#"},
        "back": {"type": ICONTYPE.ICON, "fn": () => history.back()},
        "title": {"type": file.name, "clss": "sync" + file.sync.stat},
        "add": {
          "type": ICONTYPE.ICON,
          "fn": () => {
            this.find(".inedit .orgicon.close").click();
            const $prev = this.find("#cursor");

            if ($prev[0]) {
              const node = $prev.data("node");
              $(editTmpl({"LVL": node ? node.LVL : 1, "TEXT": [], "TITLE": "", "PROPS": {}}))
                .insertAfter($prev)
                .cursor($prev)
                .find("input").focus();
            } else {
              $(editTmpl())
                .appendTo(this.find(".orglist"))
                .cursor()
                .find("input").focus();
            }
          }
        },
        "cycle": {
          "type": ICONTYPE.ICON,
          "fn": () => {
            const $allLi = this.find(".orgnotes>li").slice(1);

            if ($allLi.eq(0).hasClass("collapsed")) {
              $allLi.each((idx, li) => {
                const $li = $(li);
                const lvl = $li.data("lvl");
                $li.removeClass("collapsed");
                if (lvl == 1) {
                  updateHeadingBody($li);
                } else if (lvl == 2) {
                  $li.addClass("collapsed").show();
                }
              });
            } else {
              $allLi.each((idx, li) => {
                const $li = $(li).addClass("collapsed");

                if ($li.data("lvl") > 1) {
                  $li.hide();
                }
              });
            }
            return false;
          }
        }
      }).addClass("flex"),
      $(document.createElement("div")).orgNavbar({
        "TODO": {
          "type": ICONTYPE.TEXT,
          "fn": () => {
            const $li = this.find("#cursor");

            if ($li[0] && !$li.is(".orgbuffertext")) {
              const todoKeywords = ORG.Settings
                .getTodoKeywords(this.data("settings"))
                .filter((keyword) => keyword !== "|");

              const updateFn = (todoKeyword) => () => {
                const node = $li.data("node");
                node.TODO = todoKeyword;
                $(itemTmpl(node)).data("node", node).replaceAll($li).cursor();
                events.save(this);
              };
              this.orgNotify({
                "grid": "grid",
                "items": [{
                  "name": "None",
                  "fn": updateFn("")
                }].concat(todoKeywords.map((keyword) => ({
                  "name": keyword,
                  "fn": updateFn(keyword)
                })))
              });
            } else {
              this.orgNotify({"message": "Select a heading!"});
            }
            return $li;
          }
        },
        "PRI": {
          "type": ICONTYPE.TEXT,
          "fn": () => {
            const $li = this.find("#cursor");

            if ($li[0] && !$li.is(".orgbuffertext")) {
              const priorityLetters = ORG.Settings
                .getPriorityLetters(this.data("settings"))
                .filter((letter) => letter !== "|");

              const updateFn = (letter) => () => {
                const node = $li.data("node");
                node.PRI = letter;
                $(itemTmpl(node)).data("node", node).replaceAll($li).cursor();
                events.save(this);
              };
              this.orgNotify({
                "grid": "grid",
                "items": [{
                  "name": "None",
                  "fn": updateFn("")
                }].concat(priorityLetters.map((letter) => ({
                  "name": letter,
                  "fn": updateFn(letter)
                })))
              });
            } else {
              this.orgNotify({"message": "Select a heading!"});
            }
            return $li;
          }
        },
        "TAG": {
          "type": ICONTYPE.TEXT,
          "fn": () => {
            const $li = this.find("#cursor");

            if ($li[0] && !$li.is(".orgbuffertext")) {
              const node = $li.data("node");
              this.orgNotify({
                "message": "Set Tag(s):",
                "prompt": 1,
                "confirm": (tags) => {
                  node.TAGS = ":" + [...new Set(tags.split(/:| /).filter(Boolean))].join(":") + ":";
                  $(itemTmpl(node)).data("node", node).replaceAll($li).cursor();
                  events.save(this);
                },
                "value0": node.TAGS
              });
            } else {
              this.orgNotify({"message": "Select a heading!"});
            }
          }
        },
        "SCH": {
          "type": ICONTYPE.TEXT,
          "fn": () => {
            const $li = this.find("#cursor");

            if ($li[0] && !$li.is(".orgbuffertext")) {
              const node = $li.data("node");
              this.orgCalendar(
                ORG.Calendar.TYPE.SCH,
                node.SCHEDULED,
                (timeStr) => {
                  node.SCHEDULED = ORG.Parser.parseTimestamp(timeStr);
                  $(itemTmpl(node)).data("node", node).replaceAll($li).cursor();
                  events.save(this);
                }
              );
            } else {
              this.orgNotify({"message": "Select a heading!"});
            }
          }
        },
        "DL": {
          "type": ICONTYPE.TEXT,
          "fn": () => {
            const $li = this.find("#cursor");

            if ($li[0] && !$li.is(".orgbuffertext")) {
              const node = $li.data("node");
              this.orgCalendar(
                ORG.Calendar.TYPE.DL,
                node.DEADLINE,
                (timeStr) => {
                  node.DEADLINE = ORG.Parser.parseTimestamp(timeStr);
                  $(itemTmpl(node)).data("node", node).replaceAll($li).cursor();
                  events.save(this);
                }
              );
            } else {
              this.orgNotify({"message": "Select a heading!"});
            }
          }
        },
        "PROP": {
          "type": ICONTYPE.TEXT,
          "fn": () => {
            const $li = this.find("#cursor");

            if ($li[0] && !$li.is(".orgbuffertext")) {
              const node = $li.data("node");
              this.orgNotify({
                "message": "Set Property:",
                "prompt": 2,
                "confirm": (propKey, propVal) => {
                  if (propKey) {
                    node.PROPS[propKey.toUpperCase()] = propVal;
                    $(itemTmpl(node)).data("node", node).replaceAll($li).cursor();
                    events.save(this);
                  }
                },
                "placeholder0": "Property Key",
                "placeholder1": "Property Value"
              });
            } else {
              this.orgNotify({"message": "Select a heading!"});
            }
          }
        }
      }).addClass("gridrow"),
      `<ul class="orgnotes orglist orgview">
      ${bufferTextTmpl(nodes)}
      ${nodes.map((node) => itemTmpl(node, 0, 1)).join("")}
      </ul>`,
      nodes.length ? "" : "<div class='orgnotice'><br/>Empty file. Add notes by clicking on + icon</div></div>",
      ORG.Settings.getStyles()
    ));

    $orgNotes.find(".orglist>li")
      .first().data("node", {"TEXT": nodes.TEXT}).end()
      .slice(1).each(function (idx) {
        const $this = $(this);
        const node = nodes[idx];
        $this.data("node", node);
        if (node.LVL > 1) $this.hide();
      });
    if (nodeId) {
      updateHeadingBody($orgNotes.find(`.orglist > li:nth-child(${+nodeId + 2})`))
        .cursor()
        .cycle()
        .show()
        .scrollTo();
    } else {
      $orgNotes.find(`.orglist > li:nth-child(${1})`).cursor();
    }
    return $orgNotes;
  };
})();
