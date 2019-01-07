(() => {
  const itemTmpl = (entry) => `
    <li data-path="${entry.path_display}" data-name="${entry.name}">
      ${entry[".tag"] === "folder" ?
    `<a href="#dbox#${entry.path_lower}">
        ${ORG.icon("folder")}
        <span>${entry.name}</span>
      </a>` :
    `<button>
        ${ORG.icon("file")}
        <span>${entry.name}</span>
      </button>`}
    </li>`;
  const init = ($container) => {
    let gotoFn = () => {
      let $selected = $container.find(".select a,.select button");
      return $selected[0] && $selected[0].click();
    };
    let nextFn = () => $container.find(".select").move();
    let prevFn = () => $container.find(".select").move("prev");
    if (!$.isMobile()) {
      $(document).orgKeyboard({
        "return": gotoFn,
        "tab": gotoFn,
        "n": nextFn,
        "down": nextFn,
        "p": prevFn,
        "up": prevFn,
      });
    }
    return $container.on("click", "button", (ev) => {
      $container.append("<div class='orgloading'/>");
      let $li = $(ev.target).closest("li");
      ORG.Dropbox.getFile($li.data("path"), $li.data("name").slice(0, -4),
        () => ORG.route("#"),
        (e) => $container.orgNotify("Connection Error").find(".orgloading").remove());
      return false;
    });
  };
  $.fn.orgDropbox = function(path, cursor) {
    ORG.Dropbox.listFiles(path, cursor, (dboxResult) => init(this.removeData().off().empty().append(
      $(document.createElement("div")).orgNavbar({
        title: "Dropbox Files",
        unlink: () => this.orgNotify({
          content: "Are you sure to unlink Dropbox?",
          confirm: () => ORG.Dropbox.unlink().route("#"),
        }),
      }),
      $(document.createElement("ul")).addClass("orgdropbox").append(
        dboxResult.entries.map((entry) => (entry[".tag"] === "folder" || entry.name.match(/\.org$/)) ? itemTmpl(entry) : "")
      ).find("li:first-child").mark().end(),
      dboxResult.has_more ?
        $(document.createElement("button")).text("more").on("click", () => this.orgDropbox(path, dboxResult.cursor)) : "")
    ), () => this.orgNotify("Connection Error"));
    return this;
  };
})();
