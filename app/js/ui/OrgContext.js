(() => {
  const itemTemplate = (key, obj, isDesktop) => {
    let keyTag = isDesktop && (key <= 9) && `<b>${key}</b>` || "";
    return typeof obj.fn === "function" ?
      `<button class="${key}">${keyTag}${obj.name}</button>` :
      `<a class="${key}" href="${obj.fn}">${keyTag}${obj.name}</a>`;
  };

  const init = function($container, items = [], cancelFn) {
    let closeFn = () => $container.off().remove() && false;
    return $container.orgKeyboard({
      "esc": () => {
        cancelFn && cancelFn();
        return closeFn();
      },
    }).on("keydown", (ev) => {
      let child = $container.children()[ev.key - 1];
      child && child.click();
      return false;
    }).on("click", "a, button", (ev) => {
      let item = items[$(ev.target).index()];
      if (item) (typeof item.fn === "function") ? item.fn() : ORG.route(item.fn || "#");
      cancelFn && cancelFn();
      return closeFn();
    });
  };

  $.fn.orgContext = function(items, cancelFn) {
    if (!items[1]) { // if there is only one item, no need to choose
      let fn = items[0].fn;
      return (typeof fn === "function") ? fn() : ORG.route(fn || "#");
    }
    let isDesktop = !$.isMobile();
    return this.find(".orgcontext").off().remove().end().append(
      init($(document.createElement("ul")).addClass("orgcontext").append(
        items.map((obj, idx) => itemTemplate(idx + 1, obj, isDesktop)).join(""),
        `<button class="cancel">${isDesktop ? "<b>Esc</b>" : ""}Cancel</button>`
      ), items, cancelFn)).find("*:first-child").focus();
  };
})();
