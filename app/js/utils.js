/* eslint-disable no-param-reassign */
(() => {
  const replace = (text, matches, tag) => {
    for (const idx in matches) {
      const next = matches[idx].trim();
      text = text.replace(next, `<${tag}>${next.substr(1, next.length - 2)}</${tag}>`);
    }
    return text;
  };

  ORG.Utils = {
    "markup": (text = "") => {
      const linkRe = ORG.Parser.linkRE;
      let match;
      const el = document.createElement("div");
      el.innerText = el.textContent = text; // eslint-disable-line no-multi-assign
      text = el.innerHTML;
      if (linkRe.test(text)) {
        while (match = text.match(linkRe)) { // links
          text = text.replace(match[0], `<a class="orglink" href="${match[1]}">` + match[2] + "</a>");
        }
      }
      return replace(
        replace(
          replace(text, text.match(/(\s|^)\/[^\s][^/]*[^\s-/]\//g), "i"), // italic
          text.match(/(\s|^)\*[^\s*][^*]*[^\s-*]\*/g), "b"
        ), // bold
        text.match(/(\s|^)_[^\s_][^_]*[^\s-_]_/g), "u"
      ); // underline
    },
    "formatStr": (text, ...rest) => {
      for (let argIdx = 0, curArg, narg = rest.length; argIdx < narg; argIdx++) {
        curArg = rest[argIdx];
        text = text.replace(/%(-)?([0-9]+)(c|d)/, (_m, sign, num) => {
          const slice = Math.max(parseInt(num, 10), (curArg + "").length);
          const spaces = Array(slice).join(" ");
          return sign ? (curArg + spaces).slice(0, slice) : (spaces + curArg).slice(-slice);
        });
      }
      return text;
    },
    "isMobile": /Android|BlackBerry|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent),
    "isString": (obj) => typeof obj === "string",
    "htmlEncode": (text) => {
      const el = document.createElement("div");
      el.innerText = el.textContent = text; // eslint-disable-line no-multi-assign
      return el.innerHTML;
    },
    "singleLine": (strs, ...vals) => {
      let text = "";
      const re = /^\s+/gm;

      for (
        let valueIdx = 0, len = vals.length;
        valueIdx < len;
        valueIdx++
      ) {
        text += strs[valueIdx] + vals[valueIdx];
      }
      text += strs[vals.length];
      return text.split(/(?:\r\n|\n|\r)/).map((line) => line.replace(re, "")).join("").trim();
    },
    "quoteSplit": (text) => {
      const matches = text.match(/"[^"]+"|'[^']+'|\S+/g);
      return matches ? matches.map((match) => {
        const firstChar = match[0];
        return firstChar === "\"" || firstChar === "'" ? match.slice(1, -1) : match;
      }) : "";
    },
    "shellSplit": (shellTxt) => shellTxt ? shellTxt.split(/\s*--([^\s]+)\s+/) : []
  };
  $.fn.extend({
    "cursor": function ($oldCursor) {
      if (!this[0] || this.is("#cursor")) return this;
      ($oldCursor || $("#cursor")).removeAttr("id");
      return this.attr("id", "cursor");
    },
    "cycle": function () {
      const lvl = this.data("lvl");
      let $next = this.next();
      let nlvl = $next[0] && $next.data("lvl");

      if (nlvl > lvl) {
        if (this.hasClass("collapsed")) {
          this.toggleClass("collapsed").find(".collapsible").addClass("collapsed");
          $next.show();
          while (($next = $next.next()) && $next[0] && (nlvl = $next.data("lvl") - 1) && nlvl >= lvl) {
            if (nlvl === lvl) $next.show();
          }
        } else if ($next.hasClass("collapsed")) {
          while (($next = $next.removeClass("collapsed").show().find(".collapsible").addClass("collapsed").end().next()) && $next[0] && $next.data("lvl") > lvl);
        } else {
          this.toggleClass("collapsed");
          while (($next = $next.addClass("collapsed").hide().next()) && $next[0] && $next.data("lvl") > lvl);
        }
      } else this.toggleClass("collapsed").find(".collapsible").addClass("collapsed");
      return this;
    },
    "autoHeight": function () {
      return this[0] ? this.height(0).height(this[0].scrollHeight + 15) : this;
    },
    "isInViewport": function () {
      const $window = $(window);
      const elementTop = this.offset().top;
      const elementBottom = elementTop + this.outerHeight();
      const viewportTop = $window.scrollTop();
      const viewportBottom = viewportTop + $window.height();
      return viewportTop < elementTop - 99 && viewportBottom > elementBottom;
    },
    "scrollTo": function () {
      const container = this[0].closest(".orglist,.orgview");
      container.scrollTop = this[0].offsetTop - container.clientHeight / 2 + 50;
      return this;
    },
    "textFocus": function () {
      const text = this.val();
      return this.focus().val("").val(text);
    },
    "scrollCycle": function () {
      if (this.length) {
        const elementTop = this[0].getBoundingClientRect().top;
        const viewportHeight = $(window).height();
        window.scrollTo(0, elementTop < 95 ? this.offset().bottom + 400 : // if at top move to bottom
          elementTop > viewportHeight - 200 ? viewportHeight / 2 - 50 : // if at bottom move to middle
            80); // else it is in middle, move to top
      }
      return this;
    }
  });
})();
