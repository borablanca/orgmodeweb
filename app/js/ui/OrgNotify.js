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
    const {icon, textIcon} = ORG.Icons;
    this.find(".orgnotify").off().remove(); // remove any previous notify
    const $notify = $(document.createElement("div")).addClass("orgnotify").append(
      `<div>
${plan.message ? `<div class="orgmessage">${plan.message}</div>` : ""}
${plan.items ? `<div${plan.grid ? " class='" + plan.grid + "'" : ""}>
${plan.items.map((item) => textIcon(item.name)).join("")}
</div>` : ""}
${plan.prompt ? `${[...Array(plan.prompt).keys()].map((idx) => `
<input type="text" spellcheck="false" value="${plan["value" + idx] || ""}" placeholder="${plan["placeholder" + idx] || ""}"/>`
  ).join("")}` : ""}
${plan.confirm ? `<div class="grid">${icon("done")}${icon("close")}</div>` : ""}
</div >
</div > `
    );

    const removeFn = () => $notify.off()
      .fadeOut(150, () => $notify.remove() && plan.cb && plan.cb());

    if (plan.items) {
      $notify.on("click", ".orgicon", function () {
        const itemFn = plan.items[$(this).index()].fn;
        if ($.isFunction(itemFn)) itemFn();
        else ORG.route(itemFn);
        removeFn();
        return false;
      });
    }

    $notify
      .on("click", function (ev) {
        if (ev.target === this) return removeFn();
        const $orgicon = $(ev.target).closest(".orgicon");

        if ($orgicon[0]) {
          if ($orgicon.is(".done")) {
            plan.confirm.apply(this, plan.prompt ? $notify.find("input").map((idx, inpt) => inpt.value).toArray() : null);
          } else if (plan.cancel) plan.cancel();
          removeFn();
        }
        return false;
      })
      .hide()
      .appendTo(this)
      .fadeIn(150);

    if (plan.prompt) {
      $notify.find("input[type=text]").eq(0).textFocus();
    } else {
      $notify.find(".orgicon.done a").eq(0).focus();
    }

    if (!(plan.sticky || plan.confirm || plan.items)) {
      setTimeout(removeFn, plan.duration || 2000);
    }
    return this;
  };
})();
