(() => {
  const {search, SearchItemType} = ORG.Searcher;
  const {ICONTYPE} = ORG.Icons;
  const {markup, formatStr, singleLine} = ORG.Utils;
  const hourTmpl = (ts) => ts.hs ? ts.hs + (ts.he ? "-" + ts.he + " " : "...... ") : "";

  const timeTmpl = (node, settings) => {
    switch (node.TYPE) {
    case SearchItemType.SCH:
      return `<span class="lvl2">${!node.OFFSET || node.PROPS.STYLE === "habit" ?
        node.SCHEDULED.hs ? hourTmpl(node.SCHEDULED) : settings.scheduledLeaders[0] : // sch today
        formatStr(settings.scheduledLeaders[1], node.OFFSET)}</span>`; // sch passed
    case SearchItemType.DL:
      return `<span class="lvl2">${node.OFFSET ?
        node.OFFSET < 0 ? formatStr(settings.deadlineLeaders[1], -node.OFFSET) : // dl passed
          formatStr(settings.deadlineLeaders[2], node.OFFSET) : // dl approaching
        node.DEADLINE.hs ? hourTmpl(node.DEADLINE) : settings.deadlineLeaders[0]}</span>`; // dl today
    case SearchItemType.STAMP: return `<span>${hourTmpl(node.STAMP)}</span>`;
    case SearchItemType.ISTAMP: return "[ ";
    default: return "";
    }
  };

  const agendaItemTmpl = (node, settings) => singleLine`
  <li class="lvl1" data-url="#notes#${node.FILEID}#${node.ID}">
    <button type="button" class="oneline lvl2">${formatStr(" %-8c", node.CATEGORY || node.ICATEGORY)}</button>
    <span>
    ${timeTmpl(node, settings)}
    ${node.RANGE ? `(${node.RANGE}): ` : ""}
    ${node.TODO ? `<span class="orgtodo ${node.TODO}">${node.TODO} </span>` : ""}
    ${node.PRI ? `<span class="pri">[#${node.PRI}] </span>` : ""}
    <span class="title">${markup(node.TITLE)}</span>
    </span>
  </li>`;

  const tagItemTmpl = (node) => singleLine`
  <li class="lvl1" data-url="#notes#${node.FILEID}#${node.ID}">
    <button type="button" class="oneline lvl2">${formatStr(" %-8c", node.CATEGORY || node.ICATEGORY)}</button>
    <span>
    ${node.TODO ? `<span class="orgtodo ${node.TODO}">${node.TODO} </span>` : ""}
    ${node.PRI ? `<span class="pri">[#${node.PRI}] </span>` : ""}
    <span class="title">${markup(node.TITLE)}</span>
    </span>
  </li>`;

  const itemTmpl = {
    "agenda": (nodes, uisettings) => {
      const date = new Date(nodes.ml);
      return `<li class="orgsearchslot${nodes.today || !(date.getDay() % 6) ? " b" : ""}"><span>${uisettings.days[date.getDay()] + " " + date.getDate() + " " + uisettings.months[date.getMonth()] + " " + date.getFullYear()}<span></li>
      ${nodes.map((node) => agendaItemTmpl(node, uisettings)).join("")}`;
    },

    "search": (nodes) => `<li class="orgsearchslot"><span>${ORG.Utils.htmlEncode(nodes.header)}</span>${nodes.map((node) => tagItemTmpl(node)).join("")}</div>`
  };

  const events = {
    "cycle": ($li) => {
      let $next = $li;
      const displayFn = $li.hasClass("collapsed") ? "show" : "hide";
      $li[displayFn === "hide" ? "addClass" : "removeClass"]("collapsed");
      while (($next = $next.next()) && $next[0] && !$next.hasClass("orgsearchslot")) {
        $next[displayFn]();
      }
      return $li;
    },
    "open": ($li) => {
      const $allA = $li.find("a");

      if ($allA.length) {
        $li.closest(".orgpage").orgNotify({
          "items": [{
            "name": "Goto Heading",
            "fn": () => ORG.route($li.data("url")),
          }].concat($allA.toArray().map((anchor) => ({
            "name": `Open Link: "${anchor.text}"`,
            "fn": () => ORG.route(anchor.href),
          })))
        });
      } else {
        ORG.route($li.data("url"));
      }
      return $li;
    },
  };

  const bindKeyboard = ($orgpage) => ORG.Keyboard.bind({
    "n": ORG.Keyboard.common.cursorDown,
    "down": ORG.Keyboard.common.cursorDown,
    "p": ORG.Keyboard.common.cursorUp,
    "up": ORG.Keyboard.common.cursorUp,
    "f": () => {
      const $next = $("#cursor", $orgpage).nextAll(".orgsearchslot").eq(0);
      return $next[0] &&
        !$next.cursor().isInViewport() &&
        $next.scrollTo() &&
        false;
    },
    "b": () => {
      const $prev = $("#cursor", $orgpage).prevAll(".orgsearchslot").eq(0);
      return $prev[0] &&
        !$prev.cursor().isInViewport() &&
        $prev.scrollTo() &&
        false;
    },
    "u": () => {
      const $cursor = $("#cursor", $orgpage);

      if (!$cursor.hasClass("orgsearchslot")) {
        const $prev = $cursor.prevAll(".orgsearchslot").eq(0);

        if ($prev[0] && !$prev.cursor().isInViewport()) {
          $prev.scrollTo();
        }
      }
      return false;
    },
    "return": () => events.open($("#cursor", $orgpage)),
    "o": () => events.open($("#cursor", $orgpage)),
    "tab": () => {
      const $cursor = $("#cursor", $orgpage);
      return events[
        $cursor.hasClass("orgsearchslot") ? "cycle" : "open"
      ]($cursor);
    },
    "alt+<": ORG.Keyboard.common.cursorFirst,
    "alt+shift+<": ORG.Keyboard.common.cursorLast,
    "shift+tab": () => $orgpage.find(".orgnavbar .cycle a").click(),
    "ctrl+l": () => $("#cursor", $orgpage).scrollTo()
  });

  const init = ($orgpage) => {
    bindKeyboard($orgpage);
    return $orgpage.on("click", "li", function () {
      const $li = $(this);
      events[$li.hasClass("orgsearchslot") ? "cycle" : "open"]($li).cursor();
      return false;
    }).on("click", "button", (ev) => {
      // filter(); // TODO
      $(ev.target).closest("li").cursor();
      return false;
    }).on("click", ".orglink", (ev) => ev.preventDefault());
  };

  $.fn.orgSearch = function (searchPlan) {
    const settings = ORG.Settings.getSettingsObj();
    const uiSettings = {
      "deadlineLeaders": ORG.Utils.quoteSplit(settings["agenda-deadline-leaders"]),
      "scheduledLeaders": ORG.Utils.quoteSplit(settings["agenda-scheduled-leaders"]),
      "days": ORG.Settings.getDayNames(),
      "months": ORG.Settings.getMonthNames(),
      "todoKeywords": ORG.Settings.getTodoKeywords(settings, {}),
    };
    const nodes = search(searchPlan, ORG.Store, settings)
      .map((slot) => ORG.Sorter.sort(
        slot,
        slot["sorting-strategy"] || settings["agenda-sorting-strategy"])
      );
    const $search = init(this.removeData().off().empty().append(
      $(document.createElement("div")).orgNavbar({
        "org": {"type": ICONTYPE.ICON, "fn": "#"},
        "back": {"type": ICONTYPE.ICON, "fn": () => history.back()},
        "title": {
          "type": searchPlan[0].type === "agenda" ? "Agenda" : "Search Results",
        },
        "cycle": {
          "type": ICONTYPE.ICON,
          "fn": () => {
            const $allSlots = this.find(".orgsearchslot");
            $allSlots[$allSlots.eq(0).hasClass("collapsed") ? "addClass" : "removeClass"]("collapsed")
              .each((idx, li) => events.cycle($(li)));
          }
        }
      }).addClass("flex"),
      searchPlan.map((slot) => slot.type).includes("agenda") ?
        $(document.createElement("div")).orgNavbar({
          "<": {
            "type": ICONTYPE.TEXT,
            "fn": () => { }
          },
          "TODAY": {
            "type": ICONTYPE.TEXT,
            "fn": () => { }
          },
          "DAY": {
            "type": ICONTYPE.TEXT,
            "fn": () => { }
          },
          "WEEK": {
            "type": ICONTYPE.TEXT,
            "fn": () => { }
          },
          ">": {
            "type": ICONTYPE.TEXT,
            "fn": () => { }
          }
        }).addClass("gridrow") : "",
      `<ul class="orgsearch orglist${ORG.Utils.isMobile ? " nocursor" : ""}">
      ${nodes.map((slot) => itemTmpl[slot.type](slot, uiSettings)).join("")}
      </ul>`,
      ORG.Settings.getStyles()
    ).find("li:first-child").cursor().end());

    return $search;
  };
})();
