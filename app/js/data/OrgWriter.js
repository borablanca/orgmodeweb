(() => {
  const writeTimestamp = (orgTimestamp, days, inactive) => {
    const date = new Date(orgTimestamp.ml);
    const year = date.getFullYear();
    if (isNaN(year)) return null;
    let tsStr =
      (inactive ? "[" : "<") + year + "-" +
      ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
      ("0" + date.getDate()).slice(-2) + " " +
      days[date.getDay()];

    if (orgTimestamp.hs) {
      tsStr += " " + orgTimestamp.hs;
      if (orgTimestamp.he) tsStr += "-" + orgTimestamp.he;
    }
    if (orgTimestamp.r && orgTimestamp.rmin) {
      tsStr += " " + orgTimestamp.r + orgTimestamp.rmin;
      if (orgTimestamp.rmax) tsStr += "/" + orgTimestamp.rmax;
    }
    if (orgTimestamp.w) tsStr += " -" + orgTimestamp.w;
    if (orgTimestamp.n) {
      const nextStamp = writeTimestamp(orgTimestamp.n, days, inactive);
      if (nextStamp) return tsStr + (inactive ? "]--" : ">-") + nextStamp;
    }
    return tsStr + (inactive ? "]" : ">");
  };

  ORG.Writer = {
    writeTimestamp,
    "writeFile": (nodes) => { // eslint-disable-line
      const days = ORG.Calendar.getDayNames();
      if (!Array.isArray(nodes)) return "";
      let fileText = nodes.TEXT && nodes.TEXT.length ? nodes.TEXT + "\n" : "";

      for (let nodeIdx = 0, nnodes = nodes.length, node, props, propKeys;
        nodeIdx < nnodes;) {
        node = nodes[nodeIdx++];
        fileText += "*".repeat(parseInt(node.LVL, 10));
        if (node.TODO) fileText += " " + node.TODO;
        if (node.PRI) fileText += " [#" + node.PRI + "]";
        if (node.TITLE) fileText += " " + node.TITLE;
        if (node.TAGS) fileText += "\t\t" + node.TAGS;
        if (node.CLOSED) fileText += "\nCLOSED: " + writeTimestamp(node.CLOSED, days, 1);
        if (node.SCHEDULED && node.SCHEDULED.ml) {
          fileText += (node.CLOSED ? " " : "\n") + "SCHEDULED: " + writeTimestamp(node.SCHEDULED, days);
        }
        if (node.DEADLINE && node.DEADLINE.ml) {
          fileText += (node.CLOSED || node.SCHEDULED ? " " : "\n") + "DEADLINE: " + writeTimestamp(node.DEADLINE, days);
        }
        props = node.PROPS;
        propKeys = Object.keys(props);

        if (propKeys.length) {
          fileText += "\n:PROPERTIES:";

          for (let keyIdx = 0, nkeys = propKeys.length, curPropKey; keyIdx < nkeys;) {
            curPropKey = propKeys[keyIdx++];
            fileText += "\n:" + curPropKey + ": " + props[curPropKey];
          }
          fileText += "\n:END:";
        }
        fileText += (node.TEXT.length ? "\n" : "") + node.TEXT.join("\n") + "\n";
      }
      return fileText.trim();
    },
  };
})();
