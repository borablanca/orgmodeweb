(() => {
  const moveToSameLevel = ($li, fn) => {
    let lvl = $li.data("lvl");
    let $next = $li[fn]();
    let nlvl = $next.data("lvl");
    while (nlvl > lvl) {
      $next = $next[fn]();
      nlvl = $next.data("lvl");
    }
    return nlvl === lvl ? $next : [];
  };

  $.isString = (obj) => typeof obj === "string";

  $.isMobile = () => /Android|BlackBerry|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

  $.shellSplit = (str) => {
    let quotes = ["\"", "'"];
    let match = str.match(/"[^"]+"|'[^']+'|\S+/g);
    return match ? match.map((a) => quotes.includes(a[0]) ? a.slice(1, -1) : a) : "";
  };

  $.formatStr = (str, ...rest) => {
    for (let i = 0, curArg, narg = rest.length; i < narg; i++) {
      curArg = rest[i];
      str = str.replace(/%(-)?([0-9]+)(c|d)/, (m, sign, num) => {
        let slice = Math.max(parseInt(num, 10), (curArg + "").length);
        let spaces = Array(slice).join(" ");
        return sign ? (curArg + spaces).slice(0, slice) : (spaces + curArg).slice(-slice);
      });
    }
    return str;
  };

  const replace = (str, matches, tag) => {
    for (let i in matches) { // eslint-disable-line
      let next = matches[i].trim();
      str = str.replace(next, "<" + tag + ">" + next.substr(1, next.length - 2) + "</" + tag + ">");
    }
    return str;
  };

  $.markup = (str = "") => {
    let linkRe = ORG.Parser.linkRE;
    let match;
    while (match = str.match(linkRe)) { // links
      str = str.replace(match[0], `<a class="link" href="${match[1]}">` + match[2] + "</a>");
    }
    str = replace(str, str.match(/(\s|^)\*[^\s*][^*]*[^\s-*]\*/g), "b"); // bold
    str = replace(str, str.match(/(\s|^)\/[^\s/][^/]*[^\s-/]\//g), "i"); // italic
    str = replace(str, str.match(/(\s|^)_[^\s_][^_]*[^\s-_]_/g), "u"); // underline
    return str;
  };

  $.singleLine = (strs, ...vals) => {
    let output = "";
    let re = /^\s+/gm;
    for (let i = 0, len = vals.length; i < len; i++) output += strs[i] + vals[i];
    output += strs[vals.length];
    return output.split(/(?:\r\n|\n|\r)/).map((line) => line.replace(re, "")).join("").trim();
  };

  $.fn.cycle = function() {
    let lvl = this.data("node").lvl;
    let $next = this.next();
    let data = $next.data("node");
    let nlvl = $next[0] && data && data.lvl;

    if (nlvl > lvl) {
      if (this.hasClass("collapsed")) {
        this.toggleClass("collapsed");
        $next.show();
        while (($next = $next.next()) && $next[0] && (data = $next.data("node")) && data && (nlvl = data.lvl - 1)) (nlvl === lvl) && $next.show();
      } else if ($next.hasClass("collapsed")) {
        while (($next = $next.removeClass("collapsed").show().next()) && $next[0] && (data = $next.data("node")) && data && data.lvl > lvl);
      } else {
        this.toggleClass("collapsed");
        while (($next = $next.addClass("collapsed").hide().next()) && $next[0] && (data = $next.data("node")) && data && data.lvl > lvl);
      }
    } else this.toggleClass("collapsed");
    return this;
  },

  $.fn.mark = function($selected) {
    if (!this[0]) return this;
    ($selected || this.closest(".orgpage").find(".select")).removeClass("select");
    !this.addClass("select").isInViewport() && this.scrollTo();
    return this;
  };

  $.fn.move = function(fn = "next", sameLevel) {
    let $next = sameLevel ? moveToSameLevel(this, fn) : this[fn + "All"](":visible").first();
    $next[0] && this.removeClass("select") && $next.addClass("select") && !$next.isInViewport() && $next.scrollTo();
    return this;
  };

  $.fn.isInViewport = function() {
    let $window = $(window);
    let elementTop = this.offset().top;
    let elementBottom = elementTop + this.outerHeight();
    let viewportTop = $window.scrollTop();
    let viewportBottom = viewportTop + $window.height();
    return (viewportTop < elementTop - 60) && (viewportBottom > elementBottom);
  };

  $.fn.scrollTo = function() {
    window.scrollTo(0, this.offset().top - $(window).height() / 2 + 100);
    return this;
  };

  $.fn.scrollCycle = function() {
    if (this.length) {
      let elementTop = this[0].getBoundingClientRect().top;
      let viewportHeight = $(window).height();
      window.scrollTo(0, elementTop < 95 ? this.offset().bottom + 400 : // if at top move to bottom
        (elementTop > (viewportHeight - 200) ? (viewportHeight / 2 - 50) : // if at bottom move to middle
          80)); // else it is in middle, move to top
    }
    return this;
  };
  $.fn.moveCaret = function(toEnd) {
    let el = this[0];
    if (typeof el.selectionStart === "number") {
      el.selectionStart = el.selectionEnd = (toEnd ? -1 : 0);
    } else if (typeof el.createTextRange !== "undefined") {
      el.focus();
      var range = el.createTextRange();
      range.collapse(true);
      range.select();
    }
    return this;
  };
  $.fn.autoHeight = function() {
    this.height() !== this[0].scrollHeight && this.height(0).height(this[0].scrollHeight);
    return this;
  };
})();
