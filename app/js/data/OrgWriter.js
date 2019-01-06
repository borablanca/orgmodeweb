(() => {
  ORG.Writer = {
    writeTimestamp: (timestampObj, inactive) => {
      let date = new Date(timestampObj.ml);
      let year = date.getFullYear();
      if (isNaN(year)) return null;
      let closeTag = inactive ? "]" : ">";
      let result =
        (inactive ? "[" : "<") + year + "-" +
        ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
        ("0" + date.getDate()).slice(-2) + " " +
        ORG.Calendar.days[date.getDay()];
      if (timestampObj.hs) {
        result += " " + timestampObj.hs;
        if (timestampObj.he) result += "-" + timestampObj.he;
      }
      if (timestampObj.r && timestampObj.rmin) {
        result += " " + timestampObj.r + timestampObj.rmin;
        if (timestampObj.rmax) result += "/" + timestampObj.rmax;
      }
      if (timestampObj.w) result += " -" + timestampObj.w;
      if (timestampObj.n) {
        let n = ORG.Writer.writeTimestamp(timestampObj.n, inactive);
        if (n) return result + closeTag + "--" + n;
      }
      return result + closeTag;
    },

    write: (nodes) => {
      if (!(nodes && nodes.length && (nodes.constructor === Array))) return "";
      let curNode = nodes[0];
      let keys = Object.keys(curNode);
      let curKey;
      let curVal;
      let result = "";
      for (let k = 0, nkeys = keys.length; k < nkeys; k++) {
        curKey = keys[k];
        curVal = curNode[curKey];
        if (curKey !== "text" && curKey !== "fileName" && curVal) {
          result += "#+" + curKey + ": " + curVal + "\n";
        }
      }
      if (curNode.text) result += curNode.text + "\n";
      let curNum;
      let curStr;
      for (let n = 1, nnodes = nodes.length; n < nnodes; n++) {
        curNode = nodes[n];
        if (curNode.lvl) {
          curNum = curNode.lvl;
          while (curNum--) result += "*";
        }
        if (curNode.todo) result += " " + curNode.todo;
        if (curNode.pri) result += " [#" + curNode.pri + "]";
        if (curNode.title) result += " " + curNode.title;
        if (curNode.tags) result += "\t\t" + curNode.tags;
        if (curNode.cls) result += "\nCLOSED: " + ORG.Writer.writeTimestamp(curNode.cls, true);
        if (curNode.sch && curNode.sch.ml) result += (curNode.cls ? " " : "\n") + "SCHEDULED: " + ORG.Writer.writeTimestamp(curNode.sch);
        if (curNode.dl && curNode.dl.ml) result += ((curNode.cls || curNode.sch) ? " " : "\n") + "DEADLINE: " + ORG.Writer.writeTimestamp(curNode.dl);
        if (curNode.props) {
          let props = curNode.props;
          let keys = Object.keys(props);
          if (keys.length) {
            let propResult = "";
            let nkeys = keys.length;
            let curKey;
            while (nkeys--) {
              curKey = keys[nkeys];
              propResult = "\n:" + curKey + ": " + props[curKey] + propResult;
            }
            result += "\n:PROPERTIES:" + propResult + "\n:END:";
          }
        }
        if (curNode.logbook) {
          let logbook = curNode.logbook;
          if (logbook.length) {
            let nlog = curNode.logbook.length;
            let logResult = "";
            while (nlog--) logResult = "\n" + logbook[nlog] + logResult;
            result += "\n:LOGBOOK:" + logResult + "\n:END:";
          }
        }
        curStr = curNode.text;
        if (curStr && (typeof curStr === "string")) result += "\n" + curStr.replace(/\s*$/, "");
        result += "\n";
      }
      return result;
    },
  };
})();
