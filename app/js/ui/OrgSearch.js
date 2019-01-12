(() => {
  const searcher = ORG.Searcher;
  const calendar = ORG.Calendar;

  const hourTmpl = (hs, he) => hs ? (hs + (he ? ("-" + he + " ") : "...... ")) : "";

  const timeTmpl = (node, settings, isToday) => {
    switch (node.type) {
    case searcher.itemTypes.SCH:
      return (!node.offset || node.habit) ?
        (node.hs ? hourTmpl(node.hs, node.he) : (isToday ? settings["agenda-scheduled-leaders"][0] : "")) : // sch today
        $.formatStr(settings["agenda-scheduled-leaders"][1], node.offset); // sch passed
    case searcher.itemTypes.DL:
      return node.offset ?
        (node.offset < 0 ? $.formatStr(settings["agenda-deadline-leaders"][1], -node.offset) : // dl passed
          $.formatStr(settings["agenda-deadline-leaders"][2], node.offset)) : // dl approaching
        (node.hs ? hourTmpl(node.hs, node.he) : settings["agenda-deadline-leaders"][0]); // dl today
    case searcher.itemTypes.STAMP: return hourTmpl(node.hs, node.he);
    case searcher.itemTypes.ISTAMP: return "[ ";
    default: return "";
    }
  };

  const agendaItemTmpl = (node, settings, isToday) =>
    $.singleLine`<pre>
      <button>${$.formatStr(" %-8c", node.cat)}</button>
      <a href="#notes#${node.fid}#${node.id}">
        <span>${timeTmpl(node, settings, isToday)}</span>
        ${node.range ? `(${node.range}): ` : ""}
        ${node.todo ? `<span class="todo todo-${node.todo}">${node.todo}</span>` : ""}
        ${node.pri ? `<span class="pri">[#${node.pri}]</span>` : ""}
        <span class="title">${$.markup(node.title)}</span>
      </a>
    </pre>`;

  const tagItemTmpl = (node, settings) =>
    $.singleLine`<pre>
      <button>${$.formatStr(" %-8c", node.cat)}</button>
      <a href="#notes#${node.fid}#${node.id}">
        ${node.todo ? `<span class="todo todo-${node.todo}">${node.todo}</span>` : ""}
        ${node.pri ? `<span class="pri">[#${node.pri}]</span>` : ""}
        <span class="title">${$.markup(node.title)}</span>
      </a>
    </pre>`;

  const itemTmpl = {
    agenda: (searchResult, settings) => searchResult.slots.map((slot) => {
      let date = new Date(slot.ml);
      let archiveRE = ORG.Parser.archiveRE;
      // ${ORG.icon("add", {size: 30, color: "#0ff"})}
      return $.singleLine`<div class="orgsearchslot">
        <pre class="header${(slot.today || !(date.getDay() % 6)) ? " b" : ""}">
        ${calendar.days[date.getDay()] + " " + date.getDate() + " " + calendar.months[date.getMonth()] + " " + date.getFullYear()}
        </pre>
        ${ORG.Sorter.sort(slot.nodes.filter((node) =>
    settings["todo-keywords"].indexOf(node.todo) <= settings["todo-keywords"].indexOf("|") &&
        !node.itag.match(archiveRE)), settings["agenda-sorting-strategy"]).map((node) =>
    agendaItemTmpl(node, settings, slot.today)).join("")
  }</div > `;
    }).join(""),

    tags: (searchResult, settings) => {
      let archiveRE = ORG.Parser.archiveRE;
      return `<div class="orgsearchslot" >
        <pre class="header">${$.htmlEncode(searchResult.header)}</pre>
        ${ searchResult.nodes.filter((node) => !node.itag.match(archiveRE)).map((node) => tagItemTmpl(node, settings)).join("")}
      </div > `;
    },
    search: (searchResult, settings) => itemTmpl.tags(searchResult, settings),
  };

  const init = ($container) => {
    let moveCursor = (fn, headerFlag) => {
      let $selected = $container.find(".select");
      let $headings = $container.find((headerFlag && $selected.hasClass("header")) ? ".header" : "pre:visible");
      let index = $headings.index($selected);
      $headings.eq(fn ? --index : ++index % $headings.length).mark($selected);
      return false;
    };
    let filter = () => {
      let filterData = $container.data("filter");
      let $allPre = $container.find("pre:not(.header)");
      if (filterData.cat) {
        delete filterData.cat;
        $allPre.show();
      } else {
        let $target = $container.find(".select button");
        if ($target[0]) {
          let filter = $target.text().trim();
          filterData.cat = filter;
          $allPre.each((i, pre) => {
            let $pre = $(pre);
            $pre.find("button").text().trim() !== filter && $pre.hide();
          });
        }
      }
      $container.data("filter", filterData);
      return false;
    };
    let events = {
      cycle: ($pre) => $pre.parent().toggleClass("collapsed"),
      open: ($pre) => {
        let $allA = $pre.find("a");
        if ($allA.length === 1) ORG.route($allA.attr("href"));
        else if ($allA.length > 1) {
          $container.orgContext([{
            name: "Goto Heading",
            fn: () => ORG.route($allA[0].hash),
          }].concat($allA.toArray().slice(1).map((a) => ({
            name: `Open Link: "${a.text}"`,
            fn: () => ORG.route(a.href),
          }))), () => $container.find(".select").scrollTo());
        }
        return false;
      },
    };
    if (!$.isMobile()) {
      $(document).orgKeyboard({
        "return": () => events.open($container.find(".select")),
        "o": () => events.open($container.find(".select")),
        "tab": () => {
          let $selected = $container.find(".select");
          return events[$selected[0].classList.contains("header") ? "cycle" : "open"]($selected);
        },
        "shift+tab": () => $container.find(".orgnavbar .cycle").click(),
        "ctrl+l": () => $container.find(".select").scrollCycle(),
        "b": () => moveCursor("prev", 1),
        "f": () => moveCursor(0, 1),
        "n": () => moveCursor(),
        "down": () => moveCursor(),
        "p": () => moveCursor("prev"),
        "up": () => moveCursor("prev"),
        "u": () => {
          let $selected = $container.find(".select");
          return $selected.prevAll(".header").mark($selected);
        },
        "<": filter,
        "alt+<": () => $container.find("pre").first().mark(),
        "alt+shift+<": () => $container.find("pre").last().mark(),
      });
    }
    return $container.data("filter", {}).on("click", "pre", function() {
      return events[this.classList.contains("header") ? "cycle" : "open"]($(this).mark());
    }).on("click", "button", (ev) => {
      $(ev.target).closest("pre").mark();
      filter();
      return false;
    });
  };

  $.fn.orgSearch = function(searchPlan) {
    let files = Object.keys(ORG.Store.getFileNames());
    let settings = ORG.Settings.getSettings();
    searchPlan = searcher.compile(searchPlan, settings);
    for (let i = 0, nfiles = files.length; i < nfiles; i++) {
      searchPlan = searcher.search(ORG.Store.getFile(files[i], settings), searchPlan, settings);
    }
    let curSettings = {
      "agenda-deadline-leaders": $.shellSplit(settings["agenda-deadline-leaders"]),
      "agenda-scheduled-leaders": $.shellSplit(settings["agenda-scheduled-leaders"]),
      "agenda-sorting-strategy": settings["agenda-sorting-strategy"],
      "todo-faces": ORG.Settings.getTodoFaces(settings),
      "todo-keywords": ORG.Settings.getTodoKeywords(settings, {}),
    };
    return init(this.removeData().off().empty().append(
      ORG.Settings.getStyles(curSettings),
      $(document.createElement("div")).orgNavbar({
        cycle: () => {
          let $allSlots = this.find(".orgsearchslot");
          $allSlots[$allSlots.first().hasClass("collapsed") ? "removeClass" : "addClass"]("collapsed");
        },
        // add: "#capture",
        // filter: function() { },
        title: searchPlan[0].type === "agenda" ? "Agenda" : "Search Results",
      }),
      searchPlan.map((result) => itemTmpl[result.type](result, curSettings))
    ).find("pre").first().addClass("select").end().end(), settings);
  };
})();
