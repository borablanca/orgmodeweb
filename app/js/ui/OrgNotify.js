(() => {
  /*
   * const init = ($container, opts) => {
   *   const removeFn = () => $container.off().remove();
   *   !$.isMobile() && $container.orgKeyboard({
   *     "esc": [() => removeFn() && opts.cancel && opts.cancel() && false, {
   *       "delegate": "input",
   *       "fn": () => removeFn() && false,
   *     }],
   *     "return": {
   *       "delegate": "input",
   *       "fn": () => opts.confirm() && removeFn() && false,
   *     },
   *   });
   *   return $container.on("click", "*:not(input)", function () {
   *     if (this.classList.contains("done")) opts.confirm();
   *     else opts.cancel && opts.cancel();
   *     removeFn();
   *     return false;
   *   });
   * };
   */
  $.fn.orgNotify = function (plan) {
    this.find(".orgnotify").off().remove(); // remove any previous notify
    const {icon, textIcon} = ORG.Icons;
    const $notify = $(document.createElement("div")).addClass("orgnotify").append(
      `<div>
${plan.message ? `<div class="orgmessage">${plan.message}</div>` : ""}
${plan.items ? `<div${plan.grid ? " class='grid'" : ""}>
${plan.items.map((item) => textIcon(item.name)).join("")}
</div>` : ""}
${plan.prompt ? `<input type="text" spellcheck="false" value="${plan.default || ""}"/>` : ""}
${plan.confirm ? `<div class="grid">${icon("close")}${icon("done")}</div>` : ""}
</div>
</div>`
    ).hide();
    const removeFn = () => $notify.off()
      .fadeOut(150, () => $notify.remove() && plan.cb && plan.cb());

    if (plan.items) {
      $notify.on("click", ".orgicon", function () {
        const itemFn = plan.items[$(this).index()].fn;
        return $.isFunction(itemFn) ? itemFn() : ORG.route(itemFn);
      });
    }

    $notify
      .on("click", (ev) => ev.target.nodeName !== "INPUT" && removeFn())
      .on("click", "*:not(input)", function (ev) {
        if (ev.target !== this) return true;
        if ($(this).hasClass("done")) {
          plan.confirm(plan.prompt ? $notify.find("input").val() : "");
        } else if (plan.cancel) {
          plan.cancel();
        }
        removeFn();
        return false;
      })
      .appendTo(this)
      .fadeIn(200)
      .find(plan.prompt ? "input" : ".orgicon.done a").focus();

    if (!(plan.sticky || plan.confirm || plan.items)) {
      setTimeout(removeFn, plan.duration || 2000);
    }
    return this;
  };
})();
