(() => {
  const {icon, textIcon} = ORG.Icons;
  const TYPE = {
    "STAMP": 0,
    "SCH": 1,
    "DL": 2,
    "ISTMP": 3
  };
  const daysInMonth = (year, month) => 32 - new Date(year, month, 32).getDate();

  const createMonth = (month, year, dayNames) => {
    const ndays = daysInMonth(year, month);
    return `<div class="orgmonth">
<b class="orgdate"/>
<input type="hidden" name="year" value="${year}"/>
<input type="hidden" name="month" value="${month}"/>
<div class="grid grid7">
${textIcon("<<")}${textIcon("<")}${textIcon("TODAY")}${textIcon(">")}${textIcon(">>")}
${dayNames.map((dd, idx) => `<b class="orgday">${dayNames[(idx + 1) % 7]}</b>`).join("")}
${[...Array(((new Date(year, month)).getDay() + 6) % 7).keys()].map(() => "<b/>").join("")}
${[...Array(ndays).keys()].map((idx) => `<input type="button" value="${idx + 1}"/>`).join("")}
${[...Array(ndays < 31 ? 6 : 5).keys()].map(() => "<b>&nbsp;</b>").join("")}
</div></div>`;
  };

  const updateDateStr = ($calendar) => {
    let hour = $calendar.find("input[type=range]").val();
    const repeaterType = $calendar.find("input[name=repeatType]").val();
    const warnRange = $calendar.find("input[name=warnRange]").val();
    hour = hour === "0" ? "" :
      ("0" + (Math.ceil(hour / 2.0) - 1)).slice(-2) + ":" + (hour % 2 === 1 ? "00" : "30");

    return $calendar.find(".orgdate").text(`<${
      $calendar.find("input[name=year]").val() + "-" +
      ("0" + (+$calendar.find("input[name=month]").val() + 1)).slice(-2) + "-" +
      ("0" + $calendar.find(".orgmonth .selected").val()).slice(-2) +
      (hour ? " " + hour : "") +
      (repeaterType ? " " + repeaterType + $calendar.find("input[name=repeat]").val() + $calendar.find("input[name=repeatRange]").val() : "") +
      (warnRange ? " -" + $calendar.find("input[name=warn]").val() + warnRange : "")}>`).end();
  };

  ORG.Calendar = {
    TYPE
  };

  $.fn.orgCalendar = function (type = TYPE.SCH, ts = {}, successFn) { // eslint-disable-line
    const selectedDate = ts && ts.ml ? new Date(ts.ml) : new Date();
    const settings = ORG.Settings.getSettingsObj();
    const dayNames = ORG.Settings.getDayNames(settings);
    const monthNames = ORG.Settings.getMonthNames(settings);
    this.find(".orgcalendar").off().remove(); // remove any previous calendar

    const $calendar = $(`<div class="orgcalendar">
<div>
${createMonth(selectedDate.getMonth(), selectedDate.getFullYear(), dayNames, monthNames)}
<div class="orgtime">${icon("clock")}<input type="range" min="0" max="48" value="0"/></div>
<div class="orgrepeat">${icon("repeat")}
<div class="grid grid8">
${textIcon("+", {"clss": "orgrepeattype"})}
${textIcon(".<br/>+", {"clss": "orgrepeattype"})}
${textIcon("+<br/>+", {"clss": "orgrepeattype"})}
<div>
${textIcon("+", {"clss": "orgrepeatup"})}${textIcon("-", {"clss": "orgrepeatdown"})}
<input type="hidden" name="repeat" value="1"/>
<input type="hidden" name="repeatType" value=""/>
<input type="hidden" name="repeatRange" value=""/>
</div>
${textIcon("d", {"clss": "orgrepeatrange"})}
${textIcon("w", {"clss": "orgrepeatrange"})}
${textIcon("m", {"clss": "orgrepeatrange"})}
${textIcon("y", {"clss": "orgrepeatrange"})}
</div>
</div>
<div class="orgwarn">${icon(type === TYPE.SCH ? "delay" : "warn")}
<div class="grid grid8">
<b/><b/><b/>
<div>
${textIcon("+", {"clss": "orgwarnup"})}${textIcon("-", {"clss": "orgwarndown"})}
<input type="hidden" name="warn" value="1"/>
<input type="hidden" name="warnRange" value=""/>
</div>
${textIcon("d", {"clss": "orgwarnrange"})}
${textIcon("w", {"clss": "orgwarnrange"})}
${textIcon("m", {"clss": "orgwarnrange"})}
${textIcon("y", {"clss": "orgwarnrange"})}
</div>
</div>
<div class="grid grid3">${icon("done")}${icon("close")}${icon("delete")}</div>
</div></div>`)
      .on("click", ".orgmonth .orgicon", (ev) => { // time buttons
        let curDay = $calendar.find(".orgmonth .selected").val() - 1;
        let curMonth = $calendar.find("input[name=month]").val();
        let curYear = $calendar.find("input[name=year]").val();
        let date;

        switch ($(ev.target).index()) {
        case 0: // prev year
          curYear--;
          break;
        case 1: // prev month
          if (!curMonth--) {
            curMonth = 11;
            curYear--;
          }
          break;
        case 2: // today
          date = new Date();
          curDay = date.getDate() - 1;
          curMonth = date.getMonth();
          curYear = date.getFullYear();
          break;
        case 3: // next month
          if (curMonth++ > 10) {
            curMonth = 0;
            curYear++;
          }
          break;
        case 4: // next year
          curYear++;
          break;
        default:
          return false;
        }
        const $dayButtons = $(createMonth(curMonth, curYear, dayNames, monthNames))
          .replaceAll($calendar.find(".orgmonth"))
          .find("input[type=button]");
        let $selected = $dayButtons.eq(curDay);
        while (!$selected[0]) $selected = $dayButtons.eq(--curDay);
        $selected.addClass("selected");
        updateDateStr($calendar);
        return false;
      })
      .on("click", ".orgmonth input", function () { // day buttons
        $calendar.find(".orgmonth .selected").removeClass("selected");
        $(this).addClass("selected");
        updateDateStr($calendar);
        return false;
      })
      .on("click", function (ev) { // eslint-disable-line max-statements
        if (ev.target === this) {
          return $calendar.off().fadeOut(150, () => $calendar.remove());
        }
        const $orgicon = $(ev.target).closest(".orgicon");

        if ($orgicon[0]) {
          const confirmIconType = $orgicon[0].classList[1];

          if (["done", "delete", "close"].includes(confirmIconType)) {
            if (confirmIconType === "done") {
              successFn($calendar.find(".orgdate").text());
            } else if (confirmIconType === "delete") {
              successFn();
            }
            return $calendar.off().fadeOut(150, () => $calendar.remove());
          } else if ($orgicon.hasClass("orgrepeattype")) {
            if ($orgicon.hasClass("selected")) {
              $orgicon.removeClass("selected");
              $calendar
                .find(".orgrepeatrange")
                .removeClass("selected").end()
                .find("input[name=repeatType]").val("");
            } else {
              $calendar
                .find(".orgrepeattype")
                .removeClass("selected");
              if (!$calendar.find(".orgrepeatrange.selected")[0]) {
                $calendar
                  .find(".orgrepeatrange")
                  .eq(0)
                  .addClass("selected").end()
                  .find("input[name=repeatRange]")
                  .val("d");
              }
              $orgicon.addClass("selected");
              $calendar
                .find("input[name=repeatType]").val($orgicon.text()).end()
                .find("input[name=repeatRange]").val($calendar.find(".orgrepeatrange.selected").text());
            }
          } else if ($orgicon.hasClass("orgrepeatrange")) {
            if ($orgicon.hasClass("selected")) {
              $orgicon.removeClass("selected");
              $calendar
                .find(".orgrepeattype")
                .removeClass("selected").end()
                .find("input[name=repeatType]").val("");
            } else {
              $calendar
                .find(".orgrepeatrange")
                .removeClass("selected");
              if (!$calendar.find(".orgrepeattype.selected")[0]) {
                $calendar
                  .find(".orgrepeattype")
                  .eq(0)
                  .addClass("selected").end()
                  .find("input[name=repeatType]")
                  .val("+");
              }
              $orgicon.addClass("selected");
              $calendar
                .find("input[name=repeatRange]").val($orgicon.text()).end()
                .find("input[name=repeatType]").val($calendar.find(".orgrepeattype.selected").text());
            }
          } else if ($orgicon.hasClass("orgwarnrange")) {
            if ($orgicon.hasClass("selected")) {
              $orgicon.removeClass("selected");
              $calendar.find("input[name=warnRange]").val("");
            } else {
              $calendar.find(".orgwarnrange").removeClass("selected");
              $orgicon.addClass("selected");
              $calendar.find("input[name=warnRange]").val($orgicon.text());
            }
          } else if ($orgicon.hasClass("orgrepeatup")) {
            const $input = $calendar.find("input[name=repeat]");
            $input.val($input.val() - -1);
          } else if ($orgicon.hasClass("orgrepeatdown")) {
            const $input = $calendar.find("input[name=repeat]");
            $input.val(Math.max(1, $input.val() - 1));
          } else if ($orgicon.hasClass("orgwarnup")) {
            const $input = $calendar.find("input[name=warn]");
            $input.val($input.val() - -1);
          } else if ($orgicon.hasClass("orgwarndown")) {
            const $input = $calendar.find("input[name=warn]");
            $input.val(Math.max(1, $input.val() - 1));
          }
          updateDateStr($calendar);
        }
        return false;
      })
      .on("input", "input[type=range]", () => updateDateStr($calendar))
      .hide()
      .find("input[type=button]")
      .eq(selectedDate.getDate() - 1)
      .addClass("selected").end().end();

    if (ts) {
      if (ts.hs) {
        const parts = ts.hs.split(":");
        $calendar.find("input[type=range]").val(+parts[0] * 2 + 1 + (parts[1] === "30" ? 1 : 0));
      }
      if (ts.r) {
        const repeatType = ts.r;
        const repeatRange = ts.rmin.slice(-1);
        $calendar
          .find("input[name=repeat]").val(ts.rmin.slice(0, -1)).end()
          .find("input[name=repeatType]").val(repeatType).end()
          .find("input[name=repeatRange]").val(repeatRange).end()
          .find(".orgrepeattype").eq(repeatType === "+" ? 0 : repeatType === ".+" ? 1 : 2).addClass("selected").end().end()
          .find(".orgrepeatrange").eq(repeatRange === "d" ? 0 : repeatRange === "w" ? 1 : repeatRange === "m" ? 2 : 3).addClass("selected");
      }
      if (ts.w) {
        const warnRange = ts.w.slice(-1);
        $calendar
          .find("input[name=warn]").val(ts.w.slice(0, -1)).end()
          .find("input[name=warnRange]").val(warnRange).end()
          .find(".orgwarnrange").eq(warnRange === "d" ? 0 : warnRange === "w" ? 1 : warnRange === "m" ? 2 : 3).addClass("selected");
      }
    }

    updateDateStr($calendar).appendTo(this).fadeIn(150);
    return this;
  };
})();
