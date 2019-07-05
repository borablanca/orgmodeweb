(() => {
  const writeTimestamp = ORG.Writer.writeTimestamp;
  const archiveRE = ORG.Parser.ArchiveRE;
  const {icon, ICONTYPE} = ORG.Icons;

  const itemTmpl = (node, collapsed = false) => `
  <li class="${collapsed ? "collapsed " : ""}lvl${node.LVL % 3}${node.TAGS && node.TAGS.match(archiveRE) ? " archive" : ""}" style="padding-left:${(node.LVL - 1) * 15 + 24}px" data-lvl="${node.LVL}">
  <div class="title">${node.TODO ? `<span class="${node.TODO.toLowerCase()}">${node.TODO} </span>` : ""}${node.PRI ? `<span class="pri">[#${node.PRI}] </span>` : ""}${node.TITLE ? `<span>${$.markup(node.TITLE)}</span>` : ""}${node.TAGS ? `<span class="tag">${$.markup(node.TAGS)}</span>` : ""}</div>
  <div class="body">${node.TEXT.length ? `<pre class="txt">${$.markup(node.TEXT.join("\n"))}</pre>` : ""}</div>
  </li>`;

  const itemBodyTmpl = ($li) => {
    const node = $li.data("node");
    const propKeys = Object.keys(node.PROPS);
    return `<div class="body">
  ${node.CLOSED ? `<div class="cls">CLOSED: <span class="ts">${writeTimestamp(node.CLOSED, true)}</span></div>` : ""}
  ${node.DEADLINE ? `<div class="dl">DEADLINE: <span class="ts">${writeTimestamp(node.DEADLINE)}</span></div>` : ""}
  ${node.SCHEDULED ? `<div class="sch">SCHEDULED: <span class="ts">${writeTimestamp(node.SCHEDULED)}</span></div>` : ""}
  ${propKeys.length ? `<div class="props collapsible collapsed">
  <div>:PROPERTIES:</div>
  ${propKeys.map((key) => `<div><span>:${key}: </span><span>${$.markup(node.PROPS[key])}</span></div>`).join("")}
  <div>:END:</div>
        </div>` : ""}
        ${node.TEXT.length ? `<pre class="txt">${$.markup(node.TEXT.join("\n"))}</pre>` : ""}
      </div>`;
  };

  const editTmpl = (node = {"LVL": 1, "PROPS": {}, "TEXT": []}) => {
    const todoTxt = (node.TODO ? `${node.TODO} ` : "") + (node.PRI ? `[#${node.PRI}] ` : "");
    let bodyTxt = "";
    if (node.CLOSED) bodyTxt += `CLOSED: ${writeTimestamp(node.CLOSED)}\n`;
    if (node.SCHEDULED) bodyTxt += `SCHEDULED: ${writeTimestamp(node.SCHEDULED)}\n`;
    if (node.DEADLINE) bodyTxt += `DEADLINE: ${writeTimestamp(node.DEADLINE)}\n`;
    if (Object.keys(node.PROPS).length) bodyTxt += `:PROPERTIES:\n${Object.keys(node.PROPS).map((key) => `:${key}: ${node.PROPS[key]}`).join("\n")}\n:END:\n`;
    if (node.TEXT.length) bodyTxt += node.TEXT.join("\n");
    return `<li class="lvl${node.LVL % 3} border cf inedit" style="padding-left:${(node.LVL - 1) * 15 + 24}px" data-lvl="${node.LVL}">
 <input type="text" spellcheck="false" placeholder="note heading" value="${todoTxt + node.TITLE + (node.TAGS ? `    ${node.TAGS}` : "")}"/>
 <textarea spellcheck="false" placeholder="note body" rows="1">${bodyTxt}</textarea>
 ${icon("delete")}${icon("close")}${icon("done")}
</li > `;
  };

  const events = {
    "close": ($li) => {
      const node = $li.data("node");

      if (node) {
        return $(itemTmpl(node)).data("node", node).replaceAll($li);
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
              $orgnotes.append("<div class='orgnotice'><br/>Empty file. Add notes by clicking on + icon</div>");
            }
            $prev.cursor();
          } else {
            $li.insertAfter($prev);
          }
        },
      });
      return $();
    },
    "done": ($li, $container) => {
      const nodeData = $li.data("node");
      const bodyTxt = $li.find("textarea").val();
      const node = ORG.Parser.parseFile(
        "",
        `${"*".repeat(nodeData ? nodeData.LVL : 1)} ${$li.find("input").val().trim()}${bodyTxt.length ? "\n" + bodyTxt : ""} `,
        $container.data("settings")
      )[0];
      $container.find(".orgnotice").remove();
      const $newLi = $(itemTmpl(node)).data("node", node).replaceAll($li);

      if (events.save($container)) {
        return $newLi;
      } else if (nodeData) {
        return $(itemTmpl(nodeData)).data("node", nodeData).replaceAll($newLi);
      }
      const $prev = $newLi.prev();
      $newLi.remove();
      return $prev;
    },
    "edit": ($li) => {
      $li.closest(".orgpage").find(".inedit").each((idx, node) => {
        const $item = $(node);
        const itemNode = $item.data("node");
        $(itemTmpl(itemNode)).data("node", itemNode).replaceAll($item);
      });
      const node = $li.data("node");
      return $(editTmpl(node)).data("node", node).replaceAll($li);
    },
    "save": ($container) => {
      let file = $container.data("file");
      const allText = $(".orgbuffertext pre").text();

      try {
        file.sync.stat = ORG.Store.SyncStatus.MODIFIED;
        file = ORG.Store.updateFile(file, ORG.Parser.parseFile(
          file.name,
          allText,
          ORG.Settings.getSettingsObj()
        ).concat($.map($container.find(".orgnotes>li").slice(1), (li) => $(li).data("node"))));
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
      if (!$this.is(":first-child")) $this.cycle();
      return false;
    }).on("click", ".body", function () {
      $(this).closest("li").cursor();
      return false;
    }).on("click", ".orglist .orgicon", function () {
      events[this.classList[1]]($(this).closest("li"), $container).cursor();
      return false;
    }).on("click", ".collapsible", function () {
      $(this).toggleClass("collapsed");
    }).on("contextmenu", "li:not(.inedit)", (ev) => {
      events.context($(ev.currentTarget))
        .cursor()
        .find("textarea").autoHeight().end()
        .find("input").focus();
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

            if (!$allLi.eq(0).hasClass("collapsed")) {
              $allLi.addClass("collapsed").filter(function () {
                return $(this).data("lvl") > 1;
              }).hide();
            } else if ($allLi.eq(1).hasClass("collapsed")) {
              $allLi.removeClass("collapsed").filter(function () {
                return $(this).data("lvl") == 2;
              }).addClass("collapsed").show();
            } else {
              $allLi.removeClass("collapsed").show();
            }
            return false;
          }
        }
      }).addClass("flex"),
      $(document.createElement("div")).orgNavbar({
        "TODO": {"type": ICONTYPE.TEXT, "fn": ""},
        "PRI": {"type": ICONTYPE.TEXT, "fn": ""},
        "TAG": {"type": ICONTYPE.TEXT, "fn": ""},
        "SCH": {"type": ICONTYPE.TEXT, "fn": ""},
        "DL": {"type": ICONTYPE.TEXT, "fn": ""},
        "PROP": {"type": ICONTYPE.TEXT, "fn": ""},
        "NOTE": {"type": ICONTYPE.TEXT, "fn": ""}
      }).addClass("gridrow"),
      `<ul class="orgnotes orglist orgview">
      <li class="orgbuffertext"><pre>${nodes.TEXT || "\n"}</pre></li>
      ${nodes.map((node) => itemTmpl(node, true)).join("")}
      </ul>`,
      nodes.length ? "" : "<div class='orgnotice'><br/>Empty file. Add notes by clicking on + icon</div></div>",
      ORG.Settings.getStyles()
    ));


    $orgNotes.find(".orglist>li").slice(1).each(function (idx) {
      const $this = $(this);
      const node = nodes[idx];
      $this.data("node", node);
      if (node.LVL > 1) $this.hide();
    });
    if (nodeId) {
      $orgNotes.find(`.orglist > li:nth-child(${nodeId})`).cursor().cycle();
    } else {
      $orgNotes.find(`.orglist > li:nth-child(${1})`).cursor();
    }
    return $orgNotes;
  };
})();
