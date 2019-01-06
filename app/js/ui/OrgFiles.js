(() => {
  const createIcon = ORG.icon;
  const syncClasses = {0: "sync", 1: "modified", 2: "conflict"};

  const itemTmpl = (fileName, fileData = {}) =>
    `<li class="${syncClasses[fileData.sync] || ""}" data-filename="${fileName}">
      <a href="#notes#${fileName}">
        ${createIcon("file", {title: " "})}
        <span>${fileName}</span>
      </a>
      ${fileData.dbox ? createIcon("sync") : ""}
    </li>`;
  const itemEditTmpl = (fileName = "") =>
    `<li class="edit" data-filename="${fileName}">
      ${ORG.icon("file")}
      <input type="text" placeholder="file name" value="${fileName}"/>
      ${ORG.icon("done")}${ORG.icon("close")}${ORG.icon("delete")}
    </li>`;

  const init = ($container) => {
    let gotoFile = () => {
      let $selected = $container.find(".select a")[0];
      return $selected && $selected.click();
    };
    let events = {
      edit: ($li) => $(itemEditTmpl($li.data("filename")))
        .replaceAll($li).mark()
        .find("input").focus(),
      close: ($li, fileData) => fileData ?
        $(itemTmpl($li.data("filename"), fileData)).replaceAll($li).mark() : $li.remove(),
      context: ($li) => {
        if ($li.find(".orgicon.sync")[0]) {
          $container.orgContext([
            {name: "Edit", fn: () => events.edit($li)},
            {
              name: "Sync Force Local File",
              fn: () => {
                let fileName = $li.removeClass("conflict sync").addClass("insync").data("filename");
                let fileData = ORG.Store.getFileNames()[fileName];
                ORG.Dropbox.setFile(
                  fileName,
                  fileData,
                  ORG.Store.getFileContents(fileName),
                  () => $li.removeClass("insync").addClass("sync"),
                  () => $li.removeClass("insync") && $container.orgNotify("Connection problem, couldn't sync file."));
              },
            },
            {
              name: "Sync Force Server File",
              fn: () => {
                let fileName = $li.data("filename");
                ORG.Store.setFileProperty(fileName, {dml: 0, sync: ORG.Dropbox.SYNC.SYNC});
                return events.sync($li, ORG.Store.getFileNames()[fileName]);
              },
            },
          ]);
        } else events.edit($li);
        return false;
      },
      delete: ($li) => $container.orgNotify({
        content: "Remove file \"" + $li.data("filename") + "\"?",
        confirm: () => $container.orgFiles(ORG.Store.deleteFile($li.data("filename")).getFileNames()),
      }),
      done: ($li, fileData) => {
        let fileName = $li.find("input").val();
        try {
          ORG.Store.setFile(fileName, null, $li.data("filename"));
          $container.find(".orgnotice").remove();
          return $(itemTmpl(fileName, fileData)).replaceAll($li).mark();
        } catch (e) {
          return $container.orgNotify({content: e});
        }
      },
      sync: ($li, fileData) => fileData.dbox &&
        ORG.Dropbox.syncFile($li.removeClass("conflict sync").addClass("insync").data("filename"),
          fileData,
          (status) => $li.removeClass("insync").addClass(syncClasses[status]),
          () => $li.removeClass("insync") && $container.orgNotify("Can't sync file!")),
    };
    $(document).orgKeyboard({
      "alt+s": "#settings",
      "ctrl+return": () => $container.find(".orgnavbar .add").click(),
      "e": () => events.context($container.find(".select")),
      "esc": [() => $container.find(".select.edit .close").click(), {
        delegate: "input",
        fn: (ev) => $(ev.target).siblings(".close").click(),
      }],
      "r": () => {
        let $li = $container.find(".select:not(.edit)");
        return $li[0] && events.sync($li, ORG.Store.getFileNames()[$li.data("filename")]);
      },
      "shift+r": () => $container.find("li:not(.edit)").map((i, li) => {
        let $li = $(li);
        events.sync($li, ORG.Store.getFileNames()[$li.data("filename")]);
      }),
      "return": [gotoFile, {
        delegate: "input",
        fn: (ev) => $(ev.target).siblings(".done").click(),
      }],
      "tab": () => {
        let $selected = $container.find(".select");
        return $selected.hasClass("edit") ? $selected.find("input").focus() : gotoFile();
      },
      "n": () => $container.find(".select").move(),
      "down": () => $container.find(".select").move(),
      "p": () => $container.find(".select").move("prev"),
      "up": () => $container.find(".select").move("prev"),
      "alt+<": () => $container.find(".orgfiles>li").first().mark(),
      "alt+shift+<": () => $container.find(".orgfiles>li").last().mark(),
    }, 1);
    return $container.on("click", ".orgicon", function() {
      let $li = $(this).closest("li");
      events[this.classList[1]]($li, ORG.Store.getFileNames()[$li.data("filename")]);
      return false;
    }).on("contextmenu", "li", (ev) => events.context($(ev.target).closest("li")));
  };

  $.fn.orgFiles = function(fileNames) {
    return init(this.removeData().off().empty().append(
      $(document.createElement("div")).orgNavbar({
        add: [{
          name: "Create Local File",
          fn: () => $(itemEditTmpl("")).appendTo(this.find(".orgfiles")).mark().find("input").focus(),
        }, {
          name: "Add File From Dropbox",
          fn: "#dbox",
        }],
        settings: "#settings",
        sync: () => this.find(".orgfiles .orgicon.sync").click(),
        title: "Org",
      }),
      $(document.createElement("div")).orgMenu(ORG.Settings.getCustomAgendas()),
      $.isEmptyObject(fileNames) ?
        "<ul class='orgfiles'/><div class='orgnotice'>There aren't any org files</div>" :
        $(document.createElement("ul")).addClass("orgfiles").append(
          Object.keys(fileNames).map((fileName) => itemTmpl(fileName, fileNames[fileName]))
        ).find("li:first-child").addClass("select").end()));
  };
})();
