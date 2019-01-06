(() => {
  ORG.route = (url) => {
    if (typeof url === "string") {
      url[0] === "#" ? location.hash = url : window.open(url, "_blank");
      return false;
    }
    return location.hash;
  };
  let routes = {
    agenda: ($page, hashParts) =>
      $page.orgSearch(ORG.Settings.getCustomAgendas()[hashParts[1]] || [{type: "agenda"}]),
    capture: ($page) => $page.orgCapture(),
    dbox: ($page, hashParts) => // hashParts[1] is the path
      $page.orgDropbox((hashParts[1] && decodeURIComponent(hashParts[1])) || ""),
    files: ($page) => $page.orgFiles(ORG.Store.getFileNames()),
    notes: ($page, hashParts) => // hashParts[1] is the file name, hashParts[2] is node id
      $page.orgNotes(decodeURIComponent(hashParts[1]), hashParts[2]),
    search: ($page, hashParts) => { // m: Match TAGS|PROP|TODO query // s: Search for keywords
      let isM = hashParts[1] === "m";
      let filter = decodeURIComponent(hashParts.slice(2).join("#"));
      return $page.orgSearch([{
        header: (isM ? "Headlines with filter match: " : "Search words: ") + filter,
        filter: isM && filter,
        text: !isM && filter,
        type: isM ? "tags" : "search",
      }]);
    },
    settings: ($page) => $page.orgSettings(ORG.Settings.getSettings()),
  };
  $(window).on("hashchange", () => {
    let hashParts = location.hash.slice(1).split("#");
    return (routes[hashParts[0]] || routes["files"])($(".orgpage").append("<div class='orgloading'/>"), hashParts);
  }).trigger("hashchange");
})();
