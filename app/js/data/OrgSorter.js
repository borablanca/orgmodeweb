(() => {
  const sortStrategies = {
    "alpha": (n1, n2) => {
      const n1title = n1.TITLE;
      const n2title = n2.TITLE;
      return n1title < n2title ? 1 : n1title > n2title ? -1 : 0;
    },
    "category": (n1, n2) => {
      const n1cat = n1.PROPS.CATEGORY || n1.ICATEGORY;
      const n2cat = n2.PROPS.CATEGORY || n2.ICATEGORY;
      return n1cat < n2cat ? -1 : n1cat > n2cat ? 1 : 0;
    },
    "habit": (n1, n2) => {
      const n2habit = n2.PROPS.STYLE === "habit";
      return n1.PROPS.STYLE === "habit" ? n2habit ? 0 : 1 : n2habit ? -1 : 0;
    },
    "priority": (n1, n2) => (n1.PRI || "B").charCodeAt() - (n2.PRI || "B").charCodeAt(),
    "time": (n1, n2) => {
      const typeDiff = n2.TYPE - n1.TYPE;
      if (typeDiff) return typeDiff;
      const n1offset = n1.OFFSET;
      const n2offset = n2.OFFSET;
      const n2hs = n2.STAMP && n2.STAMP.hs;
      if (!n2offset && n1offset && n2hs) return -1;
      const n1hs = n1.STAMP && n1.STAMP.hs;
      if (!n1offset && n2offset && n1hs) return 1;
      return n1offset - n2offset || (n1hs ? n2hs ? n1hs < n2hs ? 1 : -1 : 1 : n2hs ? -1 : 0);
    },
    "todo": (n1, n2) => n2.TODOIDX - n1.TODOIDX,
  };

  ORG.Sorter = {
    "sort": (nodes = [], strategy) => {
      if (!strategy) return nodes;
      const rules = [];

      for (let sortRuleCounter = 0, sorts = strategy.split(/\s+/), nsorts = sorts.length, curSort; sortRuleCounter < nsorts;) {
        curSort = sorts[sortRuleCounter++].split("-");
        if (curSort.length === 2 && sortStrategies[curSort[0]]) {
          rules.push(curSort[1] === "up" ?
            (n1, n2) => -1 * sortStrategies[curSort[0]](n1, n2) :
            sortStrategies[curSort[0]]);
        }
      }

      return nodes.sort((n1, n2) => {
        for (let rule = 0, ruleTest = 0, nrules = rules.length; rule < nrules;) {
          ruleTest = rules[rule++](n1, n2);
          if (ruleTest !== 0) return ruleTest;
        }
        return 0;
      });
    },
  };
})();
