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
    <button class="oneline lvl2">${formatStr(" %-8c", node.CATEGORY || node.ICATEGORY)}</button>
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
    <button class="oneline lvl2">${formatStr(" %-8c", node.CATEGORY || node.ICATEGORY)}</button>
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

    "search": (nodes) => `<li class="orgsearchslot"><span>${$.htmlEncode(nodes.header)}</span>${nodes.map((node) => tagItemTmpl(node)).join("")}</div>`
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

  const init = ($container) => {
    const moveCursor = (fn, headerFlag) => {
      const $selected = $container.find(".select");
      const $headings = $container.find(headerFlag && $selected.hasClass("header") ? ".header" : "pre:visible");
      let index = $headings.index($selected);
      $headings.eq(fn ? --index : ++index % $headings.length).mark($selected);
      return false;
    };

    const filter = () => {
      const filterData = $container.data("filter");
      const $allPre = $container.find("pre:not(.header)");

      if (filterData.cat) {
        delete filterData.cat;
        $allPre.show();
      } else {
        const $target = $container.find(".select button");

        if ($target[0]) {
          const filter = $target.text().trim();
          filterData.cat = filter;
          $allPre.each((i, pre) => {
            const $pre = $(pre);
            $pre.find("button").text().trim() !== filter && $pre.hide();
          });
        }
      }
      $container.data("filter", filterData);
      return false;
    };


    /*
     * if (!ORG.Utils.isMobile) {
     *   $(document).orgKeyboard({
     *     "return": () => events.open($container.find(".select")),
     *     "o": () => events.open($container.find(".select")),
     *     "tab": () => {
     *       const $selected = $container.find(".select");
     *       return events[$selected[0].classList.contains("header") ? "cycle" : "open"]($selected);
     *     },
     *     "shift+tab": () => $container.find(".orgnavbar .cycle").click(),
     *     "ctrl+l": () => $container.find(".select").scrollCycle(),
     *     "b": () => moveCursor("prev", 1),
     *     "f": () => moveCursor(0, 1),
     *     "n": () => moveCursor(),
     *     "down": () => moveCursor(),
     *     "p": () => moveCursor("prev"),
     *     "up": () => moveCursor("prev"),
     *     "u": () => {
     *       const $selected = $container.find(".select");
     *       return $selected.prevAll(".header").mark($selected);
     *     },
     *     "<": filter,
     *     "alt+<": () => $container.find("pre").first().mark(),
     *     "alt+shift+<": () => $container.find("pre").last().mark(),
     *   });
     * }
     */
    return $container.on("click", "li", function () {
      const $li = $(this);
      events[$li.hasClass("orgsearchslot") ? "cycle" : "open"]($li).cursor();
      return false;
    }).on("click", "button", (ev) => {
      filter();
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
      `<ul class="orgsearch orglist${ORG.Utils.isMobile ? " nocursor" : ""}">
      ${nodes.map((slot) => itemTmpl[slot.type](slot, uiSettings)).join("")}
      <ul>`,
      ORG.Settings.getStyles()
    ).find("li:first-child").cursor().end());

    return $search;
  };
})();
