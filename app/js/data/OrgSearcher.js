/* eslint-disable max-lines */
(() => {
  const parseTimestamp = ORG.Parser.parseTimestamp;
  const DAY = ORG.Utils.DAY; // one day in miliseconds
  const orgRepeaterSplitRE = /([+-]?)([0-9]+)([hdwmy])/;
  const orgEscapeRE = /[[\]{}()*?.,\\^$]/g;
  const orgTagSplitGRE = /(?:(\+|-|)([^+-\s]+))/g;
  const orgTagDelimiterPropRE = /^([^<>=]+)(?:(<>|<=|<|>=|>|=)([^<>"]+))?$/;
  const archiveRE = /:ARCHIVE:/;
  const SearchItemType = {
    "SCH": 0,
    "ISTAMP": 1,
    "STAMP": 2,
    "DL": 3,
    "TEXT": 4,
  };

  const filterKeyword2rule = (curPart, negative) => {
    switch (curPart) {
    case "DEADLINE": return [`${negative ? "!" : ""}node.DEADLINE`];
    case "SCHEDULED": return [`${negative ? "!" : ""}node.SCHEDULED`];
    case "TIMESTAMP": return [`${negative ? "!" : ""}node.STMPS.length`];
    case "TODO": return [negative ? "!node.TODO" : "node.TODO&&!node.ISDONE"];
    case "DONE": return [(negative ? "!" : "") + "node.ISDONE"];
    }
    return negative ?
      `|\\b${curPart.replace(orgEscapeRE, "\\$&")}\\b` :
      `(?=.*\\b${curPart.replace(orgEscapeRE, "\\$&")}\\b)`;
  };

  const timeStr2Ml = (timeStr, ml) => {
    if ($.isNumeric(timeStr)) return timeStr;
    if (timeStr === "<today>") return new Date().setHours(0, 0, 0, 0);
    if (timeStr === "<tomorrow>") return new Date().setHours(0, 0, 0, 0) + DAY;
    if (timeStr === "<now>") return new Date().getTime();
    const timeStamp = parseTimestamp(timeStr);
    if (timeStamp) return timeStamp.ml;
    const match = timeStr.match(orgRepeaterSplitRE);
    if (!match) return ml;
    const amount = match[2] * (+match[1] + 1);
    const date = new Date(ml);

    switch (match[3]) {
    case "d": return ml + DAY * amount;
    case "w": return ml + DAY * amount * 7;
    case "m": return date.setMonth(date.getMonth() + amount);
    case "y": return date.setFullYear(date.getFullYear() + amount);
    }
    return ml; // return ml for hour (h) or anything unrelated
  };

  /* finds offset in days of nearest repeating ml to the mlEnd starting on mlStart */
  const repeatOffset = (timeStr, mlStart, mlEnd) => { // eslint-disable-line max-statements
    const match = timeStr.match(orgRepeaterSplitRE);
    const amount = +match[2];
    const letter = match[3];
    const diff = mlEnd - mlStart;
    if (diff < 0) return -1;
    if (letter === "d") return diff / DAY % amount;
    if (letter === "w") return diff / DAY % (7 * amount);
    if (letter === "m" || letter === "y") {
      const yearAmount = letter === "m" ? 1 : amount;
      let prev;

      for (let timeSpan = new Date(mlStart).getFullYear() + amount, cur = mlStart;
        mlEnd >= cur;
        timeSpan += yearAmount) {
        prev = cur;
        cur = new Date(mlStart).setYear(timeSpan);
      }
      if (letter === "y") return (mlEnd - prev) / DAY;

      for (let timeSpan = new Date(mlStart).getMonth() + amount, cur = prev;
        mlEnd >= cur;
        timeSpan += amount) {
        prev = cur;
        cur = new Date(mlStart).setMonth(timeSpan);
      }
      return (mlEnd - prev) / DAY;
    }
    return 0;
  };

  const comparisonChange = (comparison, negative) => {
    if (negative) {
      switch (comparison) {
      case "=": return "!==";
      case "<>": return "===";
      case "<": return ">=";
      case ">": return "<=";
      case "<=": return ">";
      case ">=": return "<";
      }
    } else {
      if (comparison === "=") return "===";
      if (comparison === "<>") return "!==";
    }
    return comparison;
  };

  const andRule = (part, matchings) => {
    const curPartMatch = part.match(orgTagDelimiterPropRE);
    if (!curPartMatch) return false;
    if (!curPartMatch[2]) { // no comparison, than TAG or TIME
      const negative = part[0] === "-";
      const rule = filterKeyword2rule(negative || part[0] === "+" ? part.slice(1) : part, negative);
      if (rule.constructor === Array) return rule[0];
      else if (negative) return {"type": "negative", "rule": rule}; // should be added to negative re
      return {"type": "positive", "rule": rule}; // should be added to positive re
    }
    let curPart = curPartMatch[1]; // <smth><comparison><smth>
    const curInitial = part[0];
    const curComparison = comparisonChange(curPartMatch[2], curInitial === "-");
    if (curInitial === "-" || curInitial === "+") curPart = curPart.slice(1);
    const curValue = matchings[curPartMatch[3]] || `"${curPartMatch[3]}"`;

    switch (curPart) {
    case "TODO":
      return curComparison === "===" || curComparison === "!==" ?
        `node.TODO${curComparison}${curValue}` :
        `node.TODOIDX${curComparison}fileOpts["todo-keywords"].indexOf(${curValue})`;
    case "CATEGORY": return `(node.PROPS.CATEGORY||node.ICATEGORY)${curComparison}${curValue}`;
    case "PRIORITY": return `1.0/(node.PRI||"B").charCodeAt()${curComparison}1.0/"${curValue[1]}".charCodeAt()`;
    case "LEVEL": return `node.LVL${curComparison}+${curValue}`;
    case "SCHEDULED": return `node.SCHEDULED&&node.SCHEDULED.ml${curComparison}${curValue}`;
    case "DEADLINE": return `node.DEADLINE&&node.DEADLINE.ml${curComparison}${curValue}`;
    case "TIMESTAMP": return `node.STMPS.map(s=>s.ml${curComparison}${curValue}).join("&&")`;
    }
    return `node.PROPS.${curPart}?node.PROPS.${curPart}${curComparison}${curValue}:${curComparison === "===" ? "false" : "true"}`;
  };

  const orRule = (segment, matchings) => {
    const curSegmentParts = segment.match(orgTagSplitGRE) || [];
    const curSegmentPropertyRules = [];
    let curSegmentPositiveStr = "";
    let curSegmentNegativeStr = "";
    let curSegmentREStr = "";

    // strip parts of AND matches (+, -)
    for (
      let part = 0, npart = curSegmentParts.length, rule;
      part < npart;
    ) {
      rule = andRule(curSegmentParts[part++], matchings);
      if ($.isPlainObject(rule)) {
        if (rule.type === "negative") curSegmentNegativeStr += rule.rule;
        else curSegmentPositiveStr += rule.rule;
      } else curSegmentPropertyRules.push(rule);
    }
    if (curSegmentNegativeStr.length) curSegmentREStr = `^(?!.*(${curSegmentNegativeStr.slice(1)}))`;
    if (curSegmentPositiveStr.length) curSegmentREStr += `.*${curSegmentPositiveStr}`;
    if (curSegmentREStr.length || curSegmentPropertyRules.length) {
      return {
        "re": curSegmentREStr.length ? new RegExp(`${curSegmentREStr}.*$`, "i") : null,
        "fn": curSegmentPropertyRules.length ? new Function("node", "fileOpts", `return (${curSegmentPropertyRules.join(")&&(")});`) : null,
      };
    }
    return false;
  };

  const filter2rules = (ruleText = "") => {
    const matchings = {};
    const segmentRules = [];
    const orSegments = ruleText // preprocess: no pharenthesis for safety and turn timestamps inside quotes into ml
      .replace(/\(|\)|\\/g, "")
      .replace(/"([^"]*)"/g, (match, capture, idx) => {
        matchings[idx] = /<.*>/.test(capture) ? timeStr2Ml(capture, new Date().setHours(0, 0, 0, 0)) : match;
        return idx;
      })
      .split("|")
      .filter(Boolean);

    for (let seg = 0, nors = orSegments.length, rule; seg < nors;) {
      rule = orRule(orSegments[seg++], matchings);
      if (rule) segmentRules.push(rule);
    }
    return segmentRules;
  };

  const createSlot = (plan, startMl) => Object.assign([], plan, {
    "header": plan.type === "agenda" && startMl || plan.header || plan.text || plan.filter || "Matching Headings",
    "ml": startMl,
    "re": plan.text ? new RegExp(`[\\s\\S]*${plan.text.replace(orgEscapeRE, "\\$&")}[\\s\\S]*`, "i") : null,
    "rules": filter2rules(plan.filter),
    "today": startMl === new Date().setHours(0, 0, 0, 0),
  });

  const generateSlots = (slotPlans = [], fileIdList, opts) => {
    const todayMl = new Date().setHours(0, 0, 0, 0);
    const slots = Object.assign([], {todayMl});
    const activeFilesIdx = new Set();

    for (let slot = 0, nslot = slotPlans.length, curPlan; slot < nslot;) {
      curPlan = slotPlans[slot++];
      (curPlan["agenda-files"] ? ORG.Utils.quoteSplit(curPlan["agenda-files"]) : fileIdList)
        .forEach((fileId) => activeFilesIdx.add(fileId));

      if (curPlan.type === "agenda") {
        const span = !isNaN(curPlan["agenda-span"]) && curPlan["agenda-span"] || !isNaN(opts["agenda-span"]) && opts["agenda-span"] || 7;

        for (let agendaSlot = 0, startMl = curPlan["start-date"] && timeStr2Ml(curPlan["start-date"]) || todayMl; agendaSlot++ < span; startMl += DAY) {
          slots.push(createSlot(curPlan, startMl));
        }
      } else {
        slots.push(createSlot(curPlan));
      }
    }
    return {"slots": slots, "activeFilesIdx": Array.from(activeFilesIdx)};
  };

  const matchRules = (slot, searchNode, globOpts) => {
    const nrules = slot.rules.length;

    if (slot.type !== "agenda" && !slot.re && !nrules) {
      return false;
    }
    if (
      !slot.re ||
      slot.re.test(
        searchNode.TITLE +
        searchNode.TEXT.concat(Object.values(searchNode.PROPS)).join("")
      )
    ) {
      if (!nrules) return true;
      for (let ruleIdx = 0, rule, reTest, fnTest; ruleIdx < nrules;) {
        rule = slot.rules[ruleIdx++];
        reTest = rule.re ? rule.re.test(searchNode.TAGS + searchNode.ITAGS) : true;
        fnTest = rule.fn ? rule.fn(searchNode, slot, globOpts) : true;
        if (reTest && fnTest) return true;
      }
    }
    return false;
  };

  const checkNodeFitsSlot = (slot, searchNode, globOpts) => { //eslint-disable-line
    let ml;  // ml of cur node
    let nml; // ml of next date if exists
    let sml; // ml of the slot
    let nstmps;
    let curStmp;
    const fits = {
      "0": null, // SCH
      "1": [],    // ISTMP
      "2": [],    // STMP
      "3": null, // DL
      "4": null, // TEXT
      "offset": 0,
      "ranges": []
    };

    if (slot.type === "agenda") {
      if (
        !searchNode.ISDONE &&
        (!slot.rules.length || matchRules(slot, searchNode, globOpts)) &&
        !archiveRE.test(searchNode.TAGS)
      ) {
        sml = slot.ml;
        if (curStmp = searchNode.DEADLINE) { // DEADLINE exists
          ml = curStmp.ml;
          if (curStmp.r && curStmp.rmin && sml >= ml) { // repeater exists and slot is later
            fits.offset = repeatOffset(curStmp.rmin, ml, sml);
            fits[SearchItemType.DL] = (!fits.offset || slot.today) && curStmp;
          } else { // no repeater or slot is before than node
            const offset = (sml - ml) / DAY;
            if (offset === 0) fits[SearchItemType.DL] = curStmp; // eslint-disable-line max-depth
            if (slot.today && // eslint-disable-line max-depth
              (offset > 0 || offset < 0 && ml <= timeStr2Ml((curStmp.w || slot["deadline-warning-days"] || globOpts["deadline-warning-days"] || 14) + "d", sml))) {
              fits[SearchItemType.DL] = curStmp;
              fits.offset = offset;
            }
          }
        }
        if (curStmp = searchNode.SCHEDULED) { // SCHEDULE exists
          const nodeProps = searchNode.PROPS;
          ml = curStmp.ml;
          if (sml === ml && !curStmp.w && // slot matches node and no delay
            (slot.today || nodeProps.STYLE !== "habit")) {
            fits[SearchItemType.SCH] = curStmp;
          } else if (sml >= (curStmp.w ? timeStr2Ml(curStmp.w, ml) : ml) && // slot is later than node (plus delay if exist)
            (!(nodeProps && nodeProps.STYLE === "habit") ||
              slot.today || // if habit, should be today or setting show all days
              !+(slot["show-habits-only-for-today"] || globOpts["show-habits-only-for-today"]))) {
            if (curStmp.r && curStmp.rmin) {  // eslint-disable-line max-depth
              // repeat exist
              fits.offset = repeatOffset(curStmp.rmin, ml, sml);
              fits[SearchItemType.SCH] = (!fits.offset || slot.today) && curStmp;
            } else if (slot.today) { // no repeat and slot is today
              fits[SearchItemType.SCH] = curStmp;
              fits.offset = (sml - ml) / DAY;
            }
          }
        }
        if (nstmps = searchNode.STMPS.length) { // TIMESTAMP exists
          for (let stmp = 0; stmp < nstmps;) {
            curStmp = searchNode.STMPS[stmp++];
            ml = curStmp.ml;
            nml = curStmp.n ? curStmp.n.ml : null;
            if (ml === sml) { // slot matches stamp
              fits[SearchItemType.STAMP].push(curStmp);
              fits.ranges.push(nml ? "1/" + ((nml - ml) / DAY + 1) : "");
            } else if (ml < sml && nml >= sml) { // slot inside the range
              const rangeEnd = (nml - ml) / DAY + 1;

              if (nml === sml) {
                fits[SearchItemType.STAMP].push(curStmp.n);
                fits.ranges.push(rangeEnd + "/" + rangeEnd);
              } else {
                fits[SearchItemType.STAMP].push(Object.assign({}, curStmp, {"hs": "", "he": ""}));
                fits.ranges.push(nml ?
                  (sml - ml) / DAY + 1 + "/" + rangeEnd :
                  "");
              }
            } else if (curStmp.r && curStmp.rmin) { // repeater if exists
              if (repeatOffset(curStmp.rmin, ml, sml) === 0) fits[SearchItemType.STAMP].push(curStmp);
            }
          }
        }
        if ((slot["agenda-include-inactive-timestamps"] ||
          globOpts["agenda-include-inactive-timestamps"]) &&
          (nstmps = searchNode.ISTMPS.length)) { // INACTIVE TIMESTAMP exists
          for (let stmp = 0; stmp < nstmps;) {
            curStmp = searchNode.ISTMPS[stmp++];
            if (curStmp.ml === sml) { // slot matches istamp
              fits[SearchItemType.ISTAMP].push(curStmp);
            }
          }
        }
      }
    } else {
      fits[SearchItemType.TEXT] = matchRules(slot, searchNode, globOpts);
    }
    return fits;
  };

  const fillSlot = (slot, searchNode, globOpts) => {
    const fits = checkNodeFitsSlot(slot, searchNode, globOpts);
    let stamps;

    if (fits[SearchItemType.DL]) {
      slot.push(Object.assign({}, searchNode, {
        "TYPE": SearchItemType.DL,
        "OFFSET": fits.offset,
        "STAMP": fits[SearchItemType.DL]
      }));
    } else if (fits[SearchItemType.SCH]) {
      slot.push(Object.assign({}, searchNode, {
        "TYPE": SearchItemType.SCH,
        "OFFSET": fits.offset,
        "STAMP": fits[SearchItemType.SCH]
      }));
    }
    stamps = fits[SearchItemType.STAMP];
    for (let stampIdx = 0, nstamps = stamps.length; stampIdx < nstamps; stampIdx++) {
      slot.push(Object.assign({}, searchNode, {
        "TYPE": SearchItemType.STAMP,
        "RANGE": fits.ranges[stampIdx],
        "STAMP": stamps[stampIdx],
      }));
    }
    if (slot["agenda-include-inactive-timestamps"] || globOpts["agenda-include-inactive-timestamps"]) {
      stamps = fits[SearchItemType.ISTAMP];
      for (let stampIdx = 0, nstamps = stamps.length; stampIdx < nstamps; stampIdx++) {
        slot.push(Object.assign({}, searchNode, {
          "TYPE": SearchItemType.ISTAMP,
          "STAMP": stamps[stampIdx],
        }));
      }
    }
    if (fits[SearchItemType.TEXT]) {
      searchNode.type = SearchItemType.TEXT;
      slot.push(searchNode);
    }
  };

  ORG.Searcher = {
    SearchItemType,
    "search": (searchPlan, fileProvider, opts) => { // eslint-disable-line max-statements
      const parseFile = ORG.Parser.parseFile;
      const fileList = fileProvider.getFileList();
      const fileIdList = fileList.map((file) => file.id);
      const fileListAsObj = fileList.reduce((obj, file) => {
        obj[file.id] = file;
        return obj;
      }, {});
      const {slots, activeFilesIdx} = generateSlots(searchPlan, fileIdList, opts);

      for (
        let fileIdx = 0, nfiles = activeFilesIdx.length, file, headings, todoSeperatorIdx;
        fileIdx < nfiles;
      ) {
        file = fileListAsObj[activeFilesIdx[fileIdx++]];
        headings = parseFile(file.name, fileProvider.getFileContents(file.id), opts);
        todoSeperatorIdx = headings.TODO.indexOf("|");

        for (
          let nodeIdx = 0, nnodes = headings.length, fid = file.id,
            lvl, todoIdx, searchNode, heading,
            categoryStack = [{"lvl": 0, "cat": headings.CATEGORY || file.name}],
            tagStack = [{"lvl": 0, "tag": ""}];
          nodeIdx < nnodes;
          nodeIdx++
        ) {
          heading = headings[nodeIdx];
          lvl = heading.LVL;
          todoIdx = heading.TODO ? headings.TODO.indexOf(heading.TODO) : -1;
          while (lvl <= categoryStack[categoryStack.length - 1].lvl) categoryStack.length--;
          while (lvl <= tagStack[tagStack.length - 1].lvl) tagStack.length--;
          if (heading.PROPS.CATEGORY) {
            categoryStack.push({
              "lvl": lvl,
              "cat": heading.PROPS.CATEGORY,
            });
          }
          if (heading.TAGS) {
            tagStack.push({
              "lvl": lvl,
              "tag": heading.TAGS + tagStack[tagStack.length - 1].tag,
            });
          }
          searchNode = Object.assign(heading, {
            "FILEID": fid,
            "ID": nodeIdx,
            "ICATEGORY": categoryStack[categoryStack.length - 1].cat,
            "ITAGS": tagStack[tagStack.length - 1].tag,
            "TODOIDX": todoIdx,
            "ISDONE": todoIdx > todoSeperatorIdx,
            "TYPE": -1,
            "OFFSET": 0,
            "RANGE": "",
            "STAMP": {},
          });
          for (let slotIdx = 0, nslots = slots.length, slot; slotIdx < nslots;) {
            slot = slots[slotIdx++];
            if (!slot["agenda-files"] || slot["agenda-files"].indexOf(fid) > -1) {
              fillSlot(slot, searchNode, opts);
            }
          }
        }
      }
      return slots;
    },
    archiveRE
  };
})();
