(($) => {
  const routes = {
    "agenda": ($page, hashParts) => $page.orgSearch(ORG.Settings.getCustomAgendas()[hashParts[1]] || [{"type": "agenda"}]),
    "capture": ($page) => $page.orgCapture(),
    "dbox": ($page, hashParts) => $page
      .orgDropbox(hashParts[1] && decodeURIComponent(hashParts[1]) || ""), // hashParts[1] is the path
    "files": ($page) => $page.orgFiles(ORG.Store.getFileList()),
    "notes": ($page, hashParts) => $page.orgNotes(
      ORG.Store.getFileById(decodeURIComponent(hashParts[1])), // hashParts[1] is the file id
      hashParts[2] // hashParts[2] is node id
    ),
    "search": ($page, hashParts) => { // m: Match TAGS|PROP|TODO query // s: Search for keywords
      const isM = hashParts[1] === "m";
      const filter = decodeURIComponent(hashParts.slice(2).join("#"));
      return $page.orgSearch([{
        "header": (isM ? "Headlines with filter match: " : "Search words: ") + filter,
        "filter": isM ? filter : "",
        "text": isM ? "" : filter,
        "type": "search",
      }]);
    },
    "settings": ($page) => $page.orgSettings(ORG.Settings.getSettings()),
  };

  ORG.route = (url) => {
    if (typeof url === "string") {
      if (url[0] === "#") {
        location.hash = url;
      } else {
        window.open(url, "_blank");
      }
      return false;
    }
    return location.hash;
  };
  $(window).on("hashchange", () => {
    const hashParts = location.hash.slice(1).split("#");
    return routes[
      Object.prototype.hasOwnProperty.call(routes, hashParts[0]) &&
      hashParts[0] ||
      "files"
    ]($(".orgpageactive"), hashParts);
  }).trigger("hashchange");
})(jQuery);
