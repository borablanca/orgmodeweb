(() => {
  const sortStrategies = {
    time: (node1, node2) => {
      let offset = node1.type - node2.type; // sort by type
      if (offset !== 0) return offset;
      else {
        offset = (node2.offset || 0) - (node1.offset || 0); // sort by offset
        return offset !== 0 ? offset : 0;
      }
    },
    habit: (node1, node2) => (node1.habit || node2.habit) ? (!node1.habit ? 1 : -1) : 0,
    category: (node1, node2) => node1.cat < node2.cat ? -1 : (node1.cat > node2.cat ? 1 : 0),
    priority: (node1, node2) => 1.0 / (node1.pri || "B").charCodeAt() - 1.0 / (node2.pri || "B").charCodeAt(),
    todo: (node1, node2) => node1.todoi - node2.todoi,
    alpha: (node1, node2) => node1.title < node2.title ? -1 : (node1.title > node2.title ? 1 : 0),
  };

  ORG.Sorter = {
    sort: (nodes, strategy) => {
      let strategies = strategy.split(" ");
      let sorted = firstBy((node1, node2) => { // eslint-disable-line
        let hs1 = (!node1.offset || node1.habit) && node1.hs;
        let hs2 = (!node2.offset || node2.habit) && node2.hs;
        return (hs1 || hs2) ? (!hs1 ? 1 : (!hs2 ? -1 : (hs1 < hs2) ? -1 : (hs1 > hs2 ? 1 : 0))) : 0;
      });
      for (let i = 0, curStrategy, nstrategy = strategies.length; i < nstrategy; i++) {
        curStrategy = strategies[i].split("-");
        sorted = sorted.thenBy(sortStrategies[curStrategy[0]], curStrategy[1] === "down" ? -1 : 1);
      }
      return nodes.sort(sorted);
    },
  };
})();
