(() => {
  const SLOT_TYPE = {
    AGENDA: "agenda",
    TAGS: "tags", // tag|todo|prop search same as in org-mode, additionally DEADLINE|SCHEDULED|TIMESTAMP|TODO|DONE
    SEARCH: "search",
  };
  const ITEM_TYPE = {
    SCH: 0,
    ISTAMP: 1,
    STAMP: 2,
    DL: 3,
    TEXT: 4,
    TAG: 5,
  };

  const DAY = 86400000; // one day in miliseconds
  const orgRepeaterSplitRE = /([+-]?)([0-9]+)([hdwmy])/;
  const orgEscapeRE = /[[\]{}()*?.,\\^$]/g;
  const orgTagSplitGRE = /(?:(\+|-|)([^+-\s]+))/g;
  const orgTagDelimiterPropRE = /^([^<>=]+)(?:(<>|<=|<|>=|>|=)([^<>"]+))?$/;

  const addToMl = (str, ml) => { // adds str (eg: +2d) to the milliseconds ml
    let match = str.match(orgRepeaterSplitRE);
    if (match) {
      let amount = match[2] * (match[1] === "-" ? -1 : 1);
      let letter = match[3];
      let date = new Date(ml);
      if (letter === "d") return date.setDate(date.getDate() + amount);
      if (letter === "w") return date.setDate(date.getDate() + amount * 7);
      if (letter === "m") return date.setMonth(date.getMonth() + amount);
      if (letter === "y") return date.setFullYear(date.getFullYear() + amount);
    }
    return ml;
  };

  const repeatOffset = (str, mlStart, mlEnd) => {
    // finds offset in days of nearest repeating ml to the mlEnd starting on mlStart
    let match = str.match(orgRepeaterSplitRE);
    let amount = +match[2];
    let letter = match[3];
    let diff = mlEnd - mlStart;
    if (diff < 0) return -1;
    if (letter === "d") return diff / DAY % amount;
    if (letter === "w") return diff / DAY % (7 * amount);
    if (letter === "m" || letter === "y") {
      let setFn = letter === "m" ? "setMonth" : "setFullYear";
      let prev;
      for (let i = new Date(mlStart)[letter === "m" ? "getMonth" : "getFullYear"]() + amount, cur = mlStart; mlEnd >= cur; i += amount) {
        prev = cur;
        cur = new Date(mlStart)[setFn](i);
      }
      return (mlEnd - prev) / DAY;
    }
    return 0;
  };

  const timeStringToMl = (timeStr) => {
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    if (timeStr === "<today>") return today.setHours(0, 0, 0, 0);
    if (timeStr === "<now>") return new Date().getTime();
    let match = timeStr.match(orgRepeaterSplitRE); // [sign, number, letter]
    if (match && match[2]) {
      let amount = match[2] * (match[1] === "-" ? -1 : 1);
      switch (match[3]) { // letter
      case "d": return today.setDate(today.getDate() + amount);
      case "w": return today.setDate(today.getDate() + amount * 7);
      case "m": return today.setMonth(today.getMonth() + amount);
      case "y": return today.setFullYear(today.getFullYear() + amount);
      }
    }
    let obj = ORG.Parser.parseTimestamp(timeStr);
    return obj && obj.ml;
  };

  const compileTagString = (str) => {
    let matchings = {};
    // preprocess
    str = str.replace(/\(|\)|\\/g, ""); // no pharenthesis - not supported and for safety;
    str = str.replace(/"([^"]*)"/g, (match, capture, i) => { // turn timestamps inside quotes into ml
      let key = "$" + i;
      matchings[key] = capture.match(/<.*>/) ? timeStringToMl(capture) : match;
      return key;
    });
    let orSegments = str.split("|").filter(Boolean);
    let segmentRules = [];
    let curSegment;
    let curSegmentParts;
    let curSegmentPositiveStr;
    let curSegmentNegativeStr;
    let curSegmentREStr;
    let curSegmentPropertyRules;
    let curInitial;
    let curPart;
    let curDelimiter;
    let curValue;
    let curPartMatch;
    for (let seg = 0, nors = orSegments.length; seg < nors; seg++) {
      curSegment = orSegments[seg];
      curSegmentPositiveStr = "";
      curSegmentNegativeStr = "";
      curSegmentREStr = "";
      curSegmentPropertyRules = [];
      curSegmentParts = curSegment.match(orgTagSplitGRE); // strip parts of AND matches (+, -)
      if (curSegmentParts) {
        for (let part = 0, npart = curSegmentParts.length; part < npart; part++) {
          curPart = curSegmentParts[part];
          curPartMatch = curPart.match(orgTagDelimiterPropRE);
          if (curPartMatch) {
            if (!curPartMatch[2]) { // no delimiter, than TAG or TIME
              if (curPart[0] === "-") {
                curPart = curPart.slice(1);
                if (curPart === "DEADLINE") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["!node.dl"];
                else if (curPart === "SCHEDULED") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["!node.sch"];
                else if (curPart === "TIMESTAMP") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["!node.stmps"];
                else if (curPart === "TODO") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["!node.todo"];
                else if (curPart === "DONE") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["globOpts['todo-keywords'].indexOf(node.todo)<globOpts['todo-keywords'].indexOf('|')"];
                else curSegmentNegativeStr += "|\\b" + curPart.replace(orgEscapeRE, "\\$&") + "\\b";
              } else {
                if (curPart[0] === "+") curPart = curPart.slice(1);
                if (curPart === "DEADLINE") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["node.dl"];
                else if (curPart === "SCHEDULED") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["node.sch"];
                else if (curPart === "TIMESTAMP") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["node.stmps && node.stmps.length"];
                else if (curPart === "TODO") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["globOpts['todo-keywords'].indexOf(node.todo)<globOpts['todo-keywords'].indexOf('|') && globOpts['todo-keywords'].indexOf(node.todo)>-1"];
                else if (curPart === "DONE") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["globOpts['todo-keywords'].indexOf(node.todo)>globOpts['todo-keywords'].indexOf('|')"];
                else curSegmentPositiveStr += "(?=.*\\b" + curPart.replace(orgEscapeRE, "\\$&") + "\\b)";
              }
            } else { // TODO-PROP-LEVEL
              curPart = curPartMatch[1];
              curDelimiter = curPartMatch[2];
              curInitial = curPart[0];
              if (curInitial === "-") {
                curPart = curPart.slice(1);
                if (curDelimiter === "=") curDelimiter = "!==";
                else if (curDelimiter === "<>") curDelimiter = "===";
                else if (curDelimiter === "<") curDelimiter = ">=";
                else if (curDelimiter === ">") curDelimiter = "<=";
                else if (curDelimiter === "<=") curDelimiter = ">";
                else if (curDelimiter === ">=") curDelimiter = "<";
              } else {
                if (curInitial === "+") curPart = curPart.slice(1);
                if (curDelimiter === "=") curDelimiter = "===";
                else if (curDelimiter === "<>") curDelimiter = "!==";
              }
              curValue = matchings[curPartMatch[3]] || "\"" + curPartMatch[3] + "\"";
              if (curPart === "TODO") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["node.todo" + curDelimiter + curValue];
              else if (curPart === "CATEGORY") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["opts.icat" + curDelimiter + curValue];
              else if (curPart === "PRIORITY") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["(node.pri?1.0/node.pri.charCodeAt():1.0/\"B\".charCodeAt())" + curDelimiter + (1.0 / curValue[1].charCodeAt())];
              else if (curPart === "LEVEL") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["node.lvl" + curDelimiter + "~~" + curValue];
              else if (curPart === "SCHEDULED") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["(node.sch?node.sch.ml" + curDelimiter + curValue + ":false)"];
              else if (curPart === "DEADLINE") curSegmentPropertyRules[curSegmentPropertyRules.length] = ["(node.dl?node.dl.ml" + curDelimiter + curValue + ":false)"];
              else curSegmentPropertyRules[curSegmentPropertyRules.length] = ["(node.props&&node.props." + curPart + "?node.props." + curPart + curDelimiter + curValue + ":" + (curDelimiter === "===" ? "false" : "true") + ")"];
            }
          }
        }
      }
      if (curSegmentNegativeStr.length) curSegmentREStr = "^(?!.*(" + curSegmentNegativeStr.slice(1) + "))";
      if (curSegmentPositiveStr.length) curSegmentREStr += ".*" + curSegmentPositiveStr;
      if (curSegmentREStr.length || curSegmentPropertyRules.length) {
        segmentRules[segmentRules.length] = {
          re: curSegmentREStr.length ? new RegExp(curSegmentREStr + ".*$", "i") : undefined,
          fn: curSegmentPropertyRules.length ? new Function("node", "opts", "globOpts", "return " + curSegmentPropertyRules.join(" && ") + ";") : undefined,
        };
      }
    }
    return segmentRules;
  };
  const matchRules = (node, rules, opts, globOpts) => {
    let curRule;
    let curReTest;
    let curFnTest;
    for (let rule = 0, nrules = rules.length; rule < nrules; rule++) {
      curRule = rules[rule];
      curReTest = curRule.re ? curRule.re.test(node.tags + opts.itag) : true;
      curFnTest = curRule.fn ? curRule.fn(node, opts, globOpts) : true;
      if (curReTest && curFnTest) return true;
    }
    return false;
  };
  const checkNodeFitsSlot = (node, slot, opts, globOpts, slotRules, slotOpts) => {
    let ml; // ml of cur node
    let nml; // ml of next date if exists
    let sml; // ml of the slot
    let nstmps;
    let curStmp;
    let fits = {};
    let dlWarningDays;
    switch (slot.type) {
    case SLOT_TYPE.AGENDA:
      if (!slotRules || matchRules(node, slotRules, opts, globOpts)) {
        sml = slot.ml;
        if (node.dl) { // DEADLINE exists
          curStmp = node.dl;
          dlWarningDays = curStmp.w || slotOpts["deadline-warning-days"] || globOpts["deadline-warning-days"] || 14;
          ml = curStmp.ml;
          if (curStmp.r && curStmp.rmin && sml >= ml) { // repeater exists
            fits.dlOffset = repeatOffset(curStmp.rmin, ml, sml);
            fits[ITEM_TYPE.DL] = !fits.dlOffset || slot.today;
          } else { // no repeater
            let offset = (sml - ml) / DAY;
            if (offset === 0) fits[ITEM_TYPE.DL] = true;
            if (slot.today &&
                (offset > 0 || (offset < 0 && ml <= addToMl(dlWarningDays + "d", sml)))) {
              fits[ITEM_TYPE.DL] = true;
              fits.dlOffset = offset;
            }
          }
        }
        let nodeProps = node.props;
        if (!fits[ITEM_TYPE.DL] && (curStmp = node.sch) !== undefined) { // SCHEDULE exists
          ml = curStmp.ml;
          if (sml === ml && !curStmp.w && // slot matches node and no delay
              (slot.today || !(nodeProps && nodeProps.STYLE === "habit"))) {
            fits[ITEM_TYPE.SCH] = true;
          } else if (sml >= (curStmp.w ? addToMl(curStmp.w, ml) : ml) && // slot is later than node (plus delay if exist)
              (!(nodeProps && nodeProps.STYLE === "habit") ||
                slot.today || // if habit, should be today or setting show all days
                !(slotOpts["show-habits-only-for-today"] || globOpts["show-habits-only-for-today"]))) {
            if (curStmp.r && curStmp.rmin) { // repeat exist
              fits.schOffset = repeatOffset(curStmp.rmin, ml, sml);
              fits[ITEM_TYPE.SCH] = !fits.schOffset || slot.today;
            } else if (slot.today) { // no repeat and slot is today
              fits[ITEM_TYPE.SCH] = true;
              fits.schOffset = (sml - ml) / DAY;
            }
          }
        }
        if (node.stmps) { // TIMESTAMP exists
          nstmps = node.stmps.length;
          fits[ITEM_TYPE.STAMP] = fits[ITEM_TYPE.STAMP] || [];
          for (let stmp = 0; stmp < nstmps; stmp++) {
            curStmp = node.stmps[stmp];
            ml = curStmp.ml;
            nml = curStmp.n ? curStmp.n.ml : undefined;
            if (ml === sml || (nml && nml >= sml && ml <= sml)) { // slot matches stamp or slot inside the range
              // curObj = {};
              if (nml) curStmp.stampRange = (((sml - ml) / DAY) + 1) + "/" + (((nml - ml) / DAY) + 1);
              fits[ITEM_TYPE.STAMP][fits[ITEM_TYPE.STAMP].length] = curStmp;
            } else if (curStmp.r && curStmp.rmin) { // repeater if exists
              if (repeatOffset(curStmp.rmin, ml, sml) === 0) fits[ITEM_TYPE.STAMP][fits[ITEM_TYPE.STAMP].length] = curStmp;
            }
          }
        }
        if ((slotOpts["agenda-include-inactive-timestamps"] || globOpts["agenda-include-inactive-timestamps"]) &&
            node.istmps && (nstmps = node.istmps.length)) { // INACTIVE TIMESTAMP exists
          fits[ITEM_TYPE.ISTAMP] = [];
          for (let stmp = 0; stmp < nstmps; stmp++) {
            curStmp = node.istmps[stmp];
            if (curStmp.ml === sml) { // slot matches istamp
              fits[ITEM_TYPE.ISTAMP][fits[ITEM_TYPE.ISTAMP].length] = curStmp;
            }
          }
        }
      }
      break;
    case SLOT_TYPE.TAGS:
      if (matchRules(node, slot.rules, opts, globOpts)) fits[ITEM_TYPE.TAG] = true;
      break;
    case SLOT_TYPE.SEARCH:
      if ((!slot.rules || matchRules(node, slot.rules, opts, globOpts)) && slot.re) {
        fits[ITEM_TYPE.TEXT] = slot.re.test(node.title + node.text + (node.logbook ? node.logbook.join("") : ""));
      }
      break;
    default: // unknown slot type!
    }
    return fits;
  };
  const fillSlot = (slot, node, opts, globOpts, slotRules, slotOpts) => {
    let slotNodes = slot.nodes;
    let fileId = opts.fileId;
    let nodeId = opts.nodeId;
    let category = opts.icat;
    let ncurStamps;
    let curFits = checkNodeFitsSlot(node, slot, opts, globOpts, slotRules, slotOpts);
    let curObj = {
      cat: category,
      todo: node.todo,
      todoi: (slotOpts && slotOpts["todo-keywords"]) ? slotOpts["todo-keywords"].indexOf(node.todo) :
        globOpts["todo-keywords"].indexOf(node.todo), // todoindex
      pri: node.pri,
      itag: opts.itag,
      title: node.title.trim(),
      fid: fileId,
      id: nodeId,
      node: node,
    };
    if (curFits[ITEM_TYPE.DL]) {
      slotNodes[slotNodes.length] = Object.assign(curObj, {
        type: ITEM_TYPE.DL,
        hs: node.dl.hs,
        he: node.dl.he,
        offset: curFits.dlOffset,
      });
    }
    if (curFits[ITEM_TYPE.SCH]) {
      slotNodes[slotNodes.length] = Object.assign(curObj, {
        type: ITEM_TYPE.SCH,
        hs: node.sch.hs,
        he: node.sch.he,
        habit: node.props && node.props.STYLE === "habit",
        logbook: node.logbook,
        text: node.text,
        offset: curFits.schOffset,
        range: curFits.schRange,
      });
    }
    let curStamps = curFits[ITEM_TYPE.STAMP];
    if (curStamps && (ncurStamps = curStamps.length) > 0) {
      while (ncurStamps--) {
        let curStmp = curStamps[ncurStamps];
        slotNodes[slotNodes.length] = Object.assign({}, curObj, {
          type: ITEM_TYPE.STAMP,
          hs: curStmp.hs,
          he: curStmp.he,
          cat: category,
          range: curStmp.stampRange,
        });
      }
    }
    if (curFits[ITEM_TYPE.TEXT]) {
      slotNodes[slotNodes.length] = Object.assign(curObj, {
        type: ITEM_TYPE.TEXT,
      });
    }
    if ((slotOpts && slotOpts["agenda-include-inactive-timestamps"]) ||
      globOpts["agenda-include-inactive-timestamps"]) {
      curStamps = curFits[ITEM_TYPE.ISTAMP];
      if (curStamps && (ncurStamps = curStamps.length) > 0) {
        while (ncurStamps--) {
          slotNodes[slotNodes.length] = Object.assign(curObj, {
            type: ITEM_TYPE.ISTAMP,
            hs: curStamps[ncurStamps].hs,
          });
        }
      }
    }
    if (curFits[ITEM_TYPE.TAG]) {
      slotNodes[slotNodes.length] = Object.assign(curObj, {
        type: ITEM_TYPE.TAG,
      });
    }
  };

  const compile = (slotPlans, globOpts) => {
    if (!slotPlans || !slotPlans.length) return [];
    let slots = [];
    let slotTypes = Object.values(SLOT_TYPE);
    let curPlan;
    let todayMl = new Date().setHours(0, 0, 0, 0);
    for (let i = 0, n = slotPlans.length; i < n; i++) {
      curPlan = slotPlans[i];
      if (slotTypes.indexOf(curPlan.type) > -1) {
        slots[slots.length] = compile[curPlan.type](curPlan, todayMl, globOpts);
      }
    }
    slots.todayMl = todayMl;
    return slots;
  };

  compile[SLOT_TYPE.AGENDA] = (plan, todayMl, globOpts) => {
    let startMl = (plan["start-date"] && timeStringToMl(plan["start-date"])) || todayMl;
    let agenda = {type: SLOT_TYPE.AGENDA, slots: []};
    let span = (!isNaN(plan["agenda-span"]) && plan["agenda-span"]) ||
      (!isNaN(globOpts["agenda-span"]) && globOpts["agenda-span"]) || 7;
    let curSlot;
    for (let slot = 0; slot < span; slot++, startMl += DAY) {
      curSlot = {type: SLOT_TYPE.AGENDA, ml: startMl, nodes: []};
      if (startMl === todayMl) curSlot.today = true;
      agenda.slots[agenda.slots.length] = curSlot;
    }
    if (typeof plan.filter === "string") agenda.rules = compileTagString(plan.filter.trim());
    return Object.assign(agenda, plan);
  };
  compile[SLOT_TYPE.TAGS] = (plan) => {
    let filter = (typeof plan.filter === "string") && plan.filter.trim();
    return Object.assign(plan, {
      rules: filter ? compileTagString(filter) : [],
      nodes: [],
      header: plan.header ? plan.header.trim() : filter,
    });
  };
  compile[SLOT_TYPE.SEARCH] = (plan) => {
    let filter = (typeof plan.filter === "string") && plan.filter.trim();
    let text = (typeof plan.text === "string") && plan.text.trim();
    return Object.assign(plan, {
      rules: filter ? compileTagString(filter) : undefined,
      re: text ? new RegExp("[\\s\\S]*" + text.replace(orgEscapeRE, "\\$&") + "[\\s\\S]*", "i") : null,
      // re: txt.length > 1 ? new RegExp("[\\s\\S]*(?=.*" + txt.replace(orgEscapeRE, "\\$&").split(/\s+/).join(")(?=[\\s\\S]*") + ")", "i") : null,
      header: plan.header ? plan.header.trim() : (text + (filter ? (` (${filter})`) : "")),
      nodes: [],
    });
  };
  ORG.Searcher = {
    slotTypes: SLOT_TYPE,
    itemTypes: ITEM_TYPE,
    compile: compile,
    compileTagString: compileTagString,
    search: (nodes, slots, globOpts) => { // slots: plan
      if (nodes && nodes.length) {
        if (!slots.todayMl) slots = compile(slots, globOpts);
        let nnodes = nodes.length;
        let fid = nodes[0].fileName;
        let categoryStack = [{
          lvl: 0,
          cat: nodes[0].CATEGORY || nodes[0].fileName, // set category from first node which is the settings node for that page
        }];
        let tagStack = [{lvl: 0, tag: ""}];
        let nslots = slots.length;
        let curLvl;
        let curCategory;
        let curSlot;
        let nodeOpts;
        let curNode;
        for (let node = 1; node < nnodes; node++) {
          curNode = nodes[node];
          curLvl = curNode.lvl;
          while (curLvl <= categoryStack[categoryStack.length - 1].lvl) categoryStack.length--;
          while (curLvl <= tagStack[tagStack.length - 1].lvl) tagStack.length--;
          if (curNode.props && curNode.props.CATEGORY) {
            categoryStack[categoryStack.length] = {
              lvl: curLvl,
              cat: curNode.props.CATEGORY,
            };
          }
          if (curNode.tags) {
            tagStack[tagStack.length] = {
              lvl: curLvl,
              tag: curNode.tags + tagStack[tagStack.length - 1].tag,
            };
          }
          curCategory = (curNode.props && curNode.props.CATEGORY) ? curNode.props.CATEGORY : categoryStack[categoryStack.length - 1].cat;
          nodeOpts = {
            fileId: fid,
            nodeId: node,
            icat: curCategory,
            itag: tagStack[tagStack.length - 1].tag,
          };
          for (let slot = 0; slot < nslots; slot++) {
            curSlot = slots[slot];
            switch (curSlot.type) {
            case SLOT_TYPE.AGENDA:
              for (let s = 0, n = curSlot.slots.length; s < n; s++) {
                fillSlot(curSlot.slots[s], curNode, nodeOpts, globOpts, curSlot.rules, curSlot);
              }
              break;
            case SLOT_TYPE.TAGS:
            case SLOT_TYPE.SEARCH:
              fillSlot(curSlot, curNode, nodeOpts, globOpts);
              break;
            default: // unknows slot type
            }
          }
        }
      }
      return slots;
    },
  };
})();
