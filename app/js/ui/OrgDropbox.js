(() => {
  const itemTmpl = (entry) => {
    const isFolder = entry[".tag"] === "folder";
    return `<li class="border flex" data-path="${entry.path_display}" data-name="${entry.name}">
<a class="flex" href="${isFolder ? `#dbox#${entry.path_lower}` : ""}">
  ${ORG.Icons.icon(isFolder ? "folder" : "file")}
  <span> ${entry.name}</span>
</a>
</li>`;
  };

  const init = ($container) => {
    /*
     * const gotoFn = () => {
     *   const $selected = $container.find(".select a,.select button");
     *   return $selected[0] && $selected[0].click();
     * };
     */

    /*
     * const nextFn = () => $container.find(".select").move();
     * const prevFn = () => $container.find(".select").move("prev");
     */

    /*
     * if (!$.isMobile()) {
     *   $(document).orgKeyboard({
     *     "return": gotoFn,
     *     "tab": gotoFn,
     *     "n": nextFn,
     *     "down": nextFn,
     *     "p": prevFn,
     *     "up": prevFn,
     *   });
     * }
     */
    return $container.on("click", "a", (ev) => {
      if (!$(ev.currentTarget).attr("href")) {
        const $li = $(ev.currentTarget).closest("li");
        const $page = $li
          .closest(".orgpage")
          .orgNotify({"message": "..Fetching file from Dropbox..", "sticky": 1});
        const dropboxFilePath = $li.data("path");
        const fileName = $li.data("name").slice(0, -4);
        ORG.Sync.fetchDropboxFile(
          dropboxFilePath,
          (text, metadata) => {
            try {
              const file = ORG.Store.createFile(
                fileName,
                ORG.Store.SyncType.DBOX,
                dropboxFilePath,
                ORG.Parser.parseFile(fileName, text, ORG.Settings.getSettingsObj())
              );

              if (file) {
                file.dml = new Date(metadata.server_modified).getTime();
                ORG.Store.updateFile(file);
                $page.orgNotify({
                  "message": "Added file successfully",
                  "duration": 1000,
                  "cb": () => ORG.route("#")
                });
              }
            } catch (errorMessage) {
              $page.orgNotify({"message": errorMessage});
            }
          },
          (errorMessage) => $page.orgNotify({"message": errorMessage}));
        return false;
      }
      return true;
    });
  };

  $.fn.orgDropbox = function (path, cursor) {
    const {ICONTYPE} = ORG.Icons;
    const $dbox = init(this.removeData().off().empty().append(
      $(document.createElement("div")).orgNavbar({
        "org": {"type": ICONTYPE.ICON, "fn": "#"},
        "back": {"type": ICONTYPE.ICON, "fn": () => history.back()},
        "title": {"type": "Dropbox Files"},
        "unlink": {
          "type": ICONTYPE.ICON, "fn": () => this.orgNotify({
            "message": "Are you sure to unlink Dropbox?",
            "confirm": () => {
              if (ORG.Sync.unlinkDropbox()) {
                this.orgNotify({
                  "message": "Successfully unlinked Dropbox",
                  "duration": 1000,
                  "cb": () => ORG.route("#")
                });
              }
            },
          })
        }
      }).addClass("flex")
    ));
    this.orgNotify({"message": "..Fetching File List..", "sticky": 1});
    ORG.Sync.getDropboxFileList(
      path,
      cursor,
      (dboxResult) => {
        $dbox.append(`<ul class="orglist${ORG.Utils.isMobile ? " nocursor" : ""}">
      ${dboxResult.entries.map((entry) => entry[".tag"] === "folder" || entry.name.match(/\.org$/) ? itemTmpl(entry) : "").join("")}
      </ul>`,
        dboxResult.has_more ?
          $(document.createElement("button")).text("more").on("click", () => this.orgDropbox(path, dboxResult.cursor)) : "");

        if (!ORG.Utils.isMobile) {
          $dbox.find(".orglist>li:first-child").cursor();
        }
        return $dbox.find(".orgnotify").remove().end();
      },
      () => this.orgNotify({"message": "Connection Error"})
    );
    return this;
  };
})();
