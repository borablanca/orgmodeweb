(() => {
  const DateOnlyREStr = "\\s*([\\d]{4})-([0][1-9]|[1][0-2])-([0][1-9]|[1-2][0-9]|[3][0-1])\\s*";
  const TimestampREStr = `${DateOnlyREStr}(\\w+)?\\s*(\\d{2}:\\d{2})?(?:--?(\\d{2}:\\d{2}))?(?:\\s*(\\.\\+|\\+|\\+\\+)(\\d+[hdmwy]))?(?:/(\\d+[hdmwy]))? ?(?:-(\\d+[hdmwy]))?`;
  const ActiveTimestampRE = new RegExp(`<${TimestampREStr}>(?:--?(<[^<]+>))?`);
  const ActiveTimestampGRE = new RegExp(ActiveTimestampRE, "g");
  const InactiveTimestampRE = new RegExp(`\\[${TimestampREStr}\\]`);
  const InactiveTimestampGRE = new RegExp(InactiveTimestampRE, "g");
  const AgendaTimestampRE = new RegExp(`\\s*(CLOSED|SCHEDULED|DEADLINE):\\s*(?:\\[|<)${TimestampREStr}(?:\\]|>)(?:--?(<[^<]+>))?\\s*\n?`);
  const AgendaTimestampGRE = new RegExp(AgendaTimestampRE, "g");
  const DrawerStartRE = /^\s*:([^\s]+):\s*$/i;
  const PropertyDrawerStartRE = /^\s*:PROPERTIES:\s*$/i;
  const PropertyDrawerPropertyRE = /^\s*:([^\s]+):\s*(.*)$/;
  const DrawerEndRE = /^\s*:END:\s*$/i;
  const SettingRE = /(?:^|\r\n|[\r\n])#\+(\w*):\s*([^\r\n]*)/;
  const SettingGRE = new RegExp(SettingRE, "g");
  const LinkRE = /\[\[([^\]]*)\]\[([^\]]*)\]\]/;
  const settingKeywords = ["CATEGORY", "TODO", "TAGS", "PRIORITIES"];
  const buildHeadingRE = (todoKeywords) => new RegExp(`^(\\*+)\\s+(${
    todoKeywords
      .replace(/\([^)]*\)|\|/g, "")
      .split(" ")
      .filter(Boolean)
      .join("|")
  })?\\s*(?:\\[#([a-zA-Z])\\])?\\s*(.*?)[ \\t]*(:[^\\s]+:)?\\s*(?:\\r\\n?)?$`);

  const createTimestamp = (match) => ({
    "ml": new Date(match[1], match[2] - 1, match[3]).getTime(), // miliseconds
    "hs": match[5] || "", // hour start
    "he": match[6] || "", // hour end
    "r": match[7] || "", // repeater type
    "rmin": match[8] || "", // repeat min
    "rmax": match[9] || "", // repeat max
    "w": match[10] || "", // warning days (delay days for scheduled)
    "n": match[11] ? createTimestamp(match[11].match(ActiveTimestampRE)) : "", // for range timestamps, shows the next timestamp
  });

  const updateHeadingTimestamps = (heading, parseInactiveTimestamps = 0) => {
    const text = heading.TITLE + heading.TEXT + Object.values(heading.PROPS).join("");
    let stamps = text.match(ActiveTimestampGRE);

    if (stamps) { // active timestamp(s) exist
      for (let stampIdx = 0, nstamps = stamps.length; stampIdx < nstamps;) {
        heading.STMPS.push(createTimestamp(stamps[stampIdx++].match(ActiveTimestampRE)));
      }
    }
    if (parseInactiveTimestamps && (stamps = text.match(InactiveTimestampGRE))) { // inactive exist
      for (let stampIdx = 0, nstamps = stamps.length; stampIdx < nstamps;) {
        heading.ISTMPS.push(createTimestamp(stamps[stampIdx++].match(InactiveTimestampRE)));
      }
    }
  };

  const updateInBufferSettings = (headings, bufferText = "") => {
    const matches = bufferText.match(SettingGRE) || [];

    for (
      let settingIdx = 0, nsettings = matches.length, match, setting;
      settingIdx < nsettings;
    ) {
      match = matches[settingIdx++].match(SettingRE);
      setting = match[1];
      if (setting === "SEQ_TODO" || setting === "TYP_TODO") {
        headings.TODO = match[2];
      } else if (settingKeywords.includes(setting)) { // update the setting
        headings[setting] = match[2];
      }
    }
  };

  ORG.Parser = {
    "parseFile": (fileName = "", text = "", opts = {}) => { // eslint-disable-line max-statements
      const headings = Object.assign([], {
        "FILENAME": fileName,
        "CATEGORY": fileName,
        "TAGS": opts["persistent-tags"] || [],
        "TODO": opts["todo-keywords"] || "TODO | DONE",
        "PRIORITIES": opts["priority-letters"] || "A B C",
        "TEXT": "",
      });
      updateInBufferSettings(headings, text);
      if (!text) return headings;
      const rawHeadings = text.split(/\n(?=\*+ )/);
      const parseInactiveTimestamps = +opts["agenda-include-inactive-timestamps"];
      const orgHeadingRE = buildHeadingRE(headings.TODO);
      let headingIdx = 0;

      if (!/^\*+ /.test(rawHeadings[headingIdx])) {
        headings.TEXT = rawHeadings[headingIdx++];
      }
      for (
        let nheadings = rawHeadings.length, heading, headingLines, matches;
        headingIdx < nheadings;
      ) {
        headingLines = rawHeadings[headingIdx++].split(/\n/);
        matches = headingLines[0].match(orgHeadingRE);
        heading = {
          "LVL": matches[1].length,
          "TODO": matches[2] || "",
          "PRI": matches[3] || "",
          "TITLE": matches[4] || "",
          "TAGS": matches[5] || "",
          "TEXT": [],
          "CLOSED": null,
          "SCHEDULED": null,
          "DEADLINE": null,
          "PROPS": {},
          "STMPS": [],
          "ISTMPS": [],
        };
        for (
          let lineIdx = 1, nlines = headingLines.length, line, field, lineMatches;
          lineIdx < nlines;
        ) {
          line = headingLines[lineIdx++];
          if (AgendaTimestampGRE.test(line)) { // CLOSED|SCHEDULED|DEADLINE
            lineMatches = line.match(AgendaTimestampGRE);
            for (
              let matchIdx = 0, nmatches = lineMatches.length, match;
              matchIdx < nmatches;
            ) {
              match = lineMatches[matchIdx++].match(AgendaTimestampRE);
              field = match[1];
              heading[field] = createTimestamp(match.slice(1));
              if (heading[field].n) heading.STMPS.push(heading[field]); // eslint-disable-line max-depth
            }
          } else if (PropertyDrawerStartRE.test(line)) { // PROPERTY DRAWER
            while (
              typeof (line = headingLines[lineIdx++]) === "string" &&
              !DrawerEndRE.test(line)
            ) {
              if (lineMatches = line.match(PropertyDrawerPropertyRE)) { // eslint-disable-line max-depth
                heading.PROPS[lineMatches[1].toUpperCase()] = lineMatches[2].trim();
              } else {
                heading.TEXT.push(line);
              }
            }
          } else heading.TEXT.push(line); // body TEXT of the heading
        }
        updateHeadingTimestamps(heading, parseInactiveTimestamps);
        headings.push(heading);
      }
      return headings;
    },

    "parseDrawers": (text = []) => {
      let bodyHtml = "";

      for (
        let lineIdx = 0, nlines = text.length, line;
        lineIdx < nlines;
        lineIdx++
      ) {
        line = text[lineIdx];
        if (DrawerStartRE.test(line)) {
          bodyHtml += `<div class="collapsible collapsed"><div>:${line.match(DrawerStartRE)[1]}:</div>`;
          while (
            typeof (line = text[++lineIdx]) === "string" &&
            !DrawerEndRE.test(line)
          ) {
            bodyHtml += `<div>${line}</div>`;
          }
          bodyHtml += "<div>:END:</div></div>";
        } else {
          bodyHtml += `<div>${line}</div>`;
        }
      }
      return bodyHtml;
    },

    "parseLinks": (text) => {
      /*
       * replaces links with anchors in str
       * replace instead of returning matches is for performance
       */
      let match;

      while (match = text.match(LinkRE)) {
        text = text.replace(match[0], `<a href="${match[1]}">${match[2]}</a>`); // eslint-disable-line no-param-reassign
      }
      return text;
    },

    "parseTimestamp": (text = "") => {
      /*
       * parses str for timestamps
       * returns timestamp obj or null if str is not a timestamp
       */
      const match = text.match(ActiveTimestampRE);
      return match ? createTimestamp(match) : null;
    },

    "archiveRE": /:ARCHIVE:/,
    "linkRE": LinkRE,
  };
})();
