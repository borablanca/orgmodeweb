(() => {
  const orgDateOnlyREStr = "\\s*([\\d]{4})-([0][1-9]|[1][0-2])-([0][1-9]|[1-2][0-9]|[3][0-1])\\s*";
  const orgTimestampREStr = orgDateOnlyREStr + "(\\w+)?\\s*(\\d{2}:\\d{2})?(?:--?(\\d{2}:\\d{2}))?(?:\\s*(\\.\\+|\\+|\\+\\+)(\\d+[hdmwy]))?(?:/(\\d+[hdmwy]))? ?(?:-(\\d+[hdmwy]))?";
  const orgSettingRE = /^#\+(\w*):\s*(.*)\s*(?:\r\n?)?$/;
  const orgDrawerStartRE = new RegExp("^\\s*:(PROPERTIES|LOGBOOK):\\s*(?:\\r\\n?)?$", "i");
  const orgDrawerPropertyRE = /^\s*:([^\s]+):\s*(.*)(?:\r\n?)?$/;
  const orgDrawerEndRE = /^\s*:END:\s*(?:\r\n?)?$/;
  // const orgClockRE = new RegExp("^\\s*CLOCK:\\s*\\[" + orgDateOnlyREStr + "(\\w+)?\\s*(\\d{2}):(\\d{2})\\s*\\]--?\\[" + orgDateOnlyREStr + "(\\w+)?\\s*(\\d{2}):(\\d{2})\\s*\\].*");
  // const orgStateRE = new RegExp("-\\s*State\\s+\"?\\s*(\\w+)\\s*\"?\\s+from\\s+\"?\\s*(\\w+)\\s*\"?\\s*\\[" + orgDateOnlyREStr + "(\\w+)?\\s*(\\d{2}):(\\d{2})\\s*\\]");
  const orgDateOnlyRE = new RegExp("<" + orgDateOnlyREStr + ".*>");
  const orgActiveTimestampRE = new RegExp("<" + orgTimestampREStr + ">(?:--?(<[^<]+>))?");
  const orgActiveTimestampGRE = new RegExp(orgActiveTimestampRE, "g");
  const orgInactiveTimestampRE = new RegExp("\\[" + orgTimestampREStr + "\\]");
  const orgInactiveTimestampGRE = new RegExp(orgInactiveTimestampRE, "g");
  const orgClosedRE = new RegExp("\\s*CLOSED:\\s*\\[" + orgTimestampREStr + "\\](?:--?(<[^<]+>))?");
  const orgScheduledRE = new RegExp("\\s*SCHEDULED:\\s*<" + orgTimestampREStr + ">(?:--?(<[^<]+>))?");
  const orgDeadlineRE = new RegExp("\\s*DEADLINE:\\s*<" + orgTimestampREStr + ">");
  const orgLinkRE = /\[\[([^\]]*)\]\[([^\]]*)\]\]/;

  const reToTimestampObj = function(reResultObj) {
    let tsObj = {
      ml: new Date(reResultObj[1], reResultObj[2] - 1, reResultObj[3]).getTime(),
    };
    if (reResultObj[5]) tsObj.hs = reResultObj[5]; // hour start
    if (reResultObj[6]) tsObj.he = reResultObj[6]; // hour end
    if (reResultObj[7]) tsObj.r = reResultObj[7]; // repeater type
    if (reResultObj[8]) tsObj.rmin = reResultObj[8]; // repeat min
    if (reResultObj[9]) tsObj.rmax = reResultObj[9]; // repeat max
    if (reResultObj[10]) tsObj.w = reResultObj[10]; // warning days (delay days for scheduled)
    if (reResultObj[11]) tsObj.n = reResultObj[11]; // for range timestamps, shows the next timestamp
    return tsObj;
  };

  const parseNodeForTimestamps = (node, parseInactiveTimestamps) => {
    let text = node.title + node.text +
      (node.logbook ? node.logbook.join("") : "") +
      (node.props ? Object.values(node.props).join("") : "");
    let matchA = text.match(orgActiveTimestampGRE);
    let curObj;
    if (matchA) { // active timestamp(s) exist
      if (!node.stmps) node.stmps = [];
      for (let i = 0, n = matchA.length, matchB; i < n; i++) {
        curObj = reToTimestampObj(matchA[i].match(orgActiveTimestampRE));
        if (curObj.n && (matchB = curObj.n.match(orgActiveTimestampRE))) {
          curObj.n = reToTimestampObj(matchB);
        }
        node.stmps[node.stmps.length] = curObj;
      }
    }
    if (+parseInactiveTimestamps && (matchA = text.match(orgInactiveTimestampGRE))) { // an inactive timestamp
      if (!node.istmps) node.istmps = [];
      for (let i = 0, n = matchA.length; i < n; i++) {
        curObj = reToTimestampObj(matchA[i].match(orgInactiveTimestampRE));
        node.istmps[node.istmps.length] = curObj;
      }
    }
    return node;
  };

  ORG.Parser = {
    parse: (fileName, text, opts) => {
      let curNode = {text: "", fileName: fileName}; // first node is always page settings node
      if (!text) return [curNode];
      let orgHeadingRE = ORG.Parser.buildOrgHeadingRE(opts["todo-keywords"]);
      let parseInactiveTimestamps = opts && +opts["agenda-include-inactive-timestamps"];
      let nodes = [];
      let lines = text.split("\n");
      let curMatchA;
      let curMatchB;
      let curMatchC;
      let curDrawer;
      let lastLineFlag = 0;

      let line = 0;
      let curLine = lines[line++];
      while (!curLine.match(orgHeadingRE)) { // a SETTING line for the page
        if (curMatchA = curLine.match(orgSettingRE)) {
          curMatchB = curMatchA[1];
          curNode[curMatchB] = curMatchA[2];
          if (curMatchB === "SEQ_TODO" || curMatchB === "TODO" || curMatchB === "TYP_TODO") { // update TODO keywords
            orgHeadingRE = ORG.Parser.buildOrgHeadingRE(curMatchA[2]);
          }
        } else {
          curNode.text += curLine + "\n";
        }
        if ((curLine = lines[line++]) === undefined) return [curNode];
      }
      do {
        if (!curLine.trim().length) { // no need to check the rest if empty line
          curNode.text += "\n";
          continue;
        }
        if (curMatchA = curLine.match(orgHeadingRE)) { // in heading
          if (lastLineFlag--) curNode.text = curNode.text.slice(0, -1);
          nodes[nodes.length] = parseNodeForTimestamps(curNode, parseInactiveTimestamps); // update last added node for timestamps
          curNode = {lvl: curMatchA[1].length, text: ""};
          if (curMatchA[2]) curNode.todo = curMatchA[2];
          if (curMatchA[3]) curNode.pri = curMatchA[3];
          if (curMatchA[4]) curNode.title = curMatchA[4];
          if (curMatchA[5]) curNode.tags = curMatchA[5];
        } else { // in body
          if (curMatchA = curLine.match(orgScheduledRE)) { // in SCHEDULED
            curNode.sch = reToTimestampObj(curMatchA);
            if (curNode.sch.n && (curMatchB = curNode.sch.n.match(orgActiveTimestampRE))) {
              if (!curNode.stmps) curNode.stmps = [];
              curNode.stmps[curNode.stmps.length] = Object.assign({}, curNode.sch, {n: reToTimestampObj(curMatchB)});
              delete curNode.sch.n;
            }
          }
          if (curMatchB = curLine.match(orgDeadlineRE)) { // in DEADLINE
            curNode.dl = reToTimestampObj(curMatchB);
          }
          if (curMatchC = curLine.match(orgClosedRE)) { // in CLOSED
            curNode.cls = reToTimestampObj(curMatchC);
          }
          if (curMatchA || curMatchB || curMatchC) continue;
          if (curMatchA = curLine.match(orgDrawerStartRE)) { // in a DRAWER
            curDrawer = curMatchA[1];
            curLine = lines[line++];
            if (curDrawer === "PROPERTIES") curNode.props = curNode.props || {};
            else if (curDrawer === "LOGBOOK") curNode.logbook = curNode.logbook || [];
            while (!orgDrawerEndRE.test(curLine)) {
              if (curMatchA = curLine.match(orgHeadingRE)) { // new heading! drawer has no end
                nodes[nodes.length] = parseNodeForTimestamps(curNode, parseInactiveTimestamps); // update last added node for timestamps
                curNode = {lvl: curMatchA[1].length, text: ""};
                if (curMatchA[2]) curNode.todo = curMatchA[2];
                if (curMatchA[3]) curNode.pri = curMatchA[3];
                if (curMatchA[4]) curNode.title = curMatchA[4];
                if (curMatchA[5]) curNode.tags = curMatchA[5];
                break;
              }
              if (curDrawer === "PROPERTIES") {
                if (curMatchA = curLine.match(orgDrawerPropertyRE)) {
                  curNode.props[curMatchA[1]] = curMatchA[2].trim();
                }
              } else {
                curNode.logbook[curNode.logbook.length] = curLine;
              }
              if (typeof (curLine = lines[line++]) !== "string") {
                nodes[nodes.length] = parseNodeForTimestamps(curNode, parseInactiveTimestamps);
                return nodes;
              }
            }
            continue;
          }
          curNode.text += curLine + "\n"; // if nothing from the previous, it is TEXT
          lastLineFlag = 1;
        }
      } while (typeof (curLine = lines[line++]) === "string");
      if (lastLineFlag) curNode.text = curNode.text.slice(0, -1);
      nodes[nodes.length] = parseNodeForTimestamps(curNode, parseInactiveTimestamps); // check last node for timestamps
      return nodes;
    },

    parseLinks: (str) => {
      // replaces links with anchors in str
      // replace instead of returning matches is for performance
      let match;
      while (match = str.match(orgLinkRE)) {
        str = str.replace(match[0], `<a href="${match[1]}">${match[2]}</a>`);
      }
      return str;
    },

    parseTimestamp: (str) => {
      // parses str for timestamps
      // returns timestamp obj or null if str is not a timestamp
      let match = str && str.match(orgDateOnlyRE);
      return match ? reToTimestampObj(match) : null;
    },

    buildOrgHeadingRE: (todoKeywords) => new RegExp("^(\\*+)\\s+(" +
      (todoKeywords.constructor === Array ?
        todoKeywords :
        todoKeywords.replace(/\([^)]*\)|\|/g, "").split(" ").filter(Boolean))
        .join("|") + ")?\\s*(?:\\[#([a-zA-Z])\\])?\\s*(.*?)[ \\t]*(:[^\\s]+:)?\\s*(?:\\r\\n?)?$"),

    archiveRE: /:ARCHIVE:/,
    linkRE: orgLinkRE,
  };
})();
