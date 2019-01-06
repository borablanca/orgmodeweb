(() => {
  const init = ($container, opts) => {
    return $container.on("click", ".orgicon", function() {
      if ($(this).hasClass("org")) return ORG.route("#");
      let opt = opts[this.classList[1]];
      (opt.constructor === Array) ? $container.parent().orgContext(opt) :
        (typeof opt === "function") ? opt() : ORG.route(opt || "#");
      return false;
    });
  };

  $.fn.orgNavbar = function(opts = {}) {
    return init(this.addClass("orgnavbar").html(
      `${ORG.icon("org")}
      ${$.isMobile() ? ORG.icon("back") : ""}
      <span>${opts.title || ""}</span>
      ${Object.keys(opts).map((key) => ORG.icon(key)).join("")}`
    ), Object.assign(opts, {back: () => history.back()}));
  };
})();
