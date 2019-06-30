/* eslint-disable max-lines */
const sort = ORG.Sorter.sort;
const search = ORG.Searcher.search;
const defaults = ORG.defaults;
const yesterdayDate = new Date(new Date().setDate(new Date().getDate() - 1));
const todayDate = new Date();
const tomorrowDate = new Date(new Date().setDate(new Date().getDate() + 1));
const yesterday = `<${yesterdayDate.getFullYear()}-${("0" + (yesterdayDate.getMonth() + 1)).slice(-2)}-${("0" + yesterdayDate.getDate()).slice(-2)}`;
const today = `<${todayDate.getFullYear()}-${("0" + (todayDate.getMonth() + 1)).slice(-2)}-${("0" + todayDate.getDate()).slice(-2)}`;
const tomorrow = `<${tomorrowDate.getFullYear()}-${("0" + (tomorrowDate.getMonth() + 1)).slice(-2)}-${("0" + tomorrowDate.getDate()).slice(-2)}`;

QUnit.module("OrgSorter Tests", () => {
  const fileProvider = {
    "getFileNames": () => ["f1", "f2", "f3"],
    "getFile": (fname) => ({
      "f1": `
#+SEQ_TODO: TODO NEXT | DONE CANC

* DONE node 1
SCHEDULED: <2019-02-10>
:PROPERTIES:
:CATEGORY: cat3
:END:
* NEXT node 2
SCHEDULED: <2019-02-09 +1d>
:PROPERTIES:
:CATEGORY: cat2
:STYLE: habit
:END:
** [#A] node 3
SCHEDULED: <2019-02-10 12:00>
*** CANC node 4
DEADLINE: <2018-02-09>
* TODO [#C] node 5
DEADLINE: <2019-02-13>
:PROPERTIES:
:CATEGORY: cat1
:END:
* DONE [#A] node 6
DEADLINE: <2018-02-12>
:PROPERTIES:
:STYLE: habit
:END:
* TODO [#B] node 7
SCHEDULED: <2019-02-09>`,


      "f2": `* node 2
SCHEDULED: ${yesterday} +1d>
:PROPERTIES:
:STYLE: habit
:END:
* TODO [#C] node 5
DEADLINE: ${tomorrow}>
* TODO [#B] node 7
SCHEDULED: ${yesterday}>
** [#A] node 3
SCHEDULED: ${today} 12:00>`,


      "f3": `
* node 1
SCHEDULED: ${today} 13:00-14:00>
* node 2
SCHEDULED: ${yesterday} +1d>
** node 3
SCHEDULED: ${today} 12:00>
*** node 4
SCHEDULED: ${yesterday}>
* node 5
DEADLINE: ${yesterday}>
* node 6
DEADLINE: ${yesterday} 11:00>
* node 7
DEADLINE: ${tomorrow}>
* node 8
DEADLINE: ${tomorrow} 12:00>`
    })[fname]
  };
  QUnit.test("wrong sort strategies - empty string", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 1");
    assert.equal(sortedNodes[1].TITLE, "node 2");
    assert.equal(sortedNodes[2].TITLE, "node 3");
    assert.equal(sortedNodes[3].TITLE, "node 4");
    assert.equal(sortedNodes[4].TITLE, "node 5");
    assert.equal(sortedNodes[5].TITLE, "node 6");
    assert.equal(sortedNodes[6].TITLE, "node 7");
  });
  QUnit.test("wrong sort strategies - unrelated string", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "some text");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 1");
    assert.equal(sortedNodes[1].TITLE, "node 2");
    assert.equal(sortedNodes[2].TITLE, "node 3");
    assert.equal(sortedNodes[3].TITLE, "node 4");
    assert.equal(sortedNodes[4].TITLE, "node 5");
    assert.equal(sortedNodes[5].TITLE, "node 6");
    assert.equal(sortedNodes[6].TITLE, "node 7");
  });
  QUnit.test("wrong sort strategies - multiway", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "todo-up-down");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 1");
    assert.equal(sortedNodes[1].TITLE, "node 2");
    assert.equal(sortedNodes[2].TITLE, "node 3");
    assert.equal(sortedNodes[3].TITLE, "node 4");
    assert.equal(sortedNodes[4].TITLE, "node 5");
    assert.equal(sortedNodes[5].TITLE, "node 6");
    assert.equal(sortedNodes[6].TITLE, "node 7");
  });
  QUnit.test("sort by alpha-up", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "alpha-up");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 1");
    assert.equal(sortedNodes[1].TITLE, "node 2");
    assert.equal(sortedNodes[2].TITLE, "node 3");
    assert.equal(sortedNodes[3].TITLE, "node 4");
    assert.equal(sortedNodes[4].TITLE, "node 5");
    assert.equal(sortedNodes[5].TITLE, "node 6");
    assert.equal(sortedNodes[6].TITLE, "node 7");
  });
  QUnit.test("sort by alpha-down", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "alpha-down");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 7");
    assert.equal(sortedNodes[1].TITLE, "node 6");
    assert.equal(sortedNodes[2].TITLE, "node 5");
    assert.equal(sortedNodes[3].TITLE, "node 4");
    assert.equal(sortedNodes[4].TITLE, "node 3");
    assert.equal(sortedNodes[5].TITLE, "node 2");
    assert.equal(sortedNodes[6].TITLE, "node 1");
  });
  QUnit.test("sort by category-down", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "category-down");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 5");
    assert.equal(sortedNodes[1].TITLE, "node 2");
    assert.equal(sortedNodes[2].TITLE, "node 3");
    assert.equal(sortedNodes[3].TITLE, "node 4");
    assert.equal(sortedNodes[4].TITLE, "node 1");
    assert.equal(sortedNodes[5].TITLE, "node 6");
    assert.equal(sortedNodes[6].TITLE, "node 7");
  });
  QUnit.test("sort by category-up", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "category-up");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 6");
    assert.equal(sortedNodes[1].TITLE, "node 7");
    assert.equal(sortedNodes[2].TITLE, "node 1");
    assert.equal(sortedNodes[3].TITLE, "node 2");
    assert.equal(sortedNodes[4].TITLE, "node 3");
    assert.equal(sortedNodes[5].TITLE, "node 4");
    assert.equal(sortedNodes[6].TITLE, "node 5");
  });
  QUnit.test("sort by habit", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    let sortedNodes = sort(slots[0], "habit-up");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 2");
    assert.equal(sortedNodes[1].TITLE, "node 6");
    sortedNodes = sort(slots[0], "habit-down");
    assert.equal(sortedNodes[5].TITLE, "node 2");
    assert.equal(sortedNodes[6].TITLE, "node 6");
  });
  QUnit.test("sort by priority-down", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "priority-down");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 3");
    assert.equal(sortedNodes[1].TITLE, "node 6");
    assert.equal(sortedNodes[2].TITLE, "node 1");
    assert.equal(sortedNodes[3].TITLE, "node 2");
    assert.equal(sortedNodes[4].TITLE, "node 4");
    assert.equal(sortedNodes[5].TITLE, "node 7");
    assert.equal(sortedNodes[6].TITLE, "node 5");
  });
  QUnit.test("sort by priority-up", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "priority-up");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 5");
    assert.equal(sortedNodes[1].TITLE, "node 1");
    assert.equal(sortedNodes[2].TITLE, "node 2");
    assert.equal(sortedNodes[3].TITLE, "node 4");
    assert.equal(sortedNodes[4].TITLE, "node 7");
    assert.equal(sortedNodes[5].TITLE, "node 3");
    assert.equal(sortedNodes[6].TITLE, "node 6");
  });
  QUnit.test("sort by todo-down", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "todo-down");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 4");
    assert.equal(sortedNodes[1].TITLE, "node 1");
    assert.equal(sortedNodes[2].TITLE, "node 6");
    assert.equal(sortedNodes[3].TITLE, "node 2");
    assert.equal(sortedNodes[4].TITLE, "node 5");
    assert.equal(sortedNodes[5].TITLE, "node 7");
    assert.equal(sortedNodes[6].TITLE, "node 3");
  });
  QUnit.test("sort by todo-up", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "todo-up");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 3");
    assert.equal(sortedNodes[1].TITLE, "node 5");
    assert.equal(sortedNodes[2].TITLE, "node 7");
    assert.equal(sortedNodes[3].TITLE, "node 2");
    assert.equal(sortedNodes[4].TITLE, "node 1");
    assert.equal(sortedNodes[5].TITLE, "node 6");
    assert.equal(sortedNodes[6].TITLE, "node 4");
  });
  QUnit.test("sort by todo-down alpha-up", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "todo-down alpha-up");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 4");
    assert.equal(sortedNodes[1].TITLE, "node 1");
    assert.equal(sortedNodes[2].TITLE, "node 6");
    assert.equal(sortedNodes[3].TITLE, "node 2");
    assert.equal(sortedNodes[4].TITLE, "node 5");
    assert.equal(sortedNodes[5].TITLE, "node 7");
    assert.equal(sortedNodes[6].TITLE, "node 3");
  });
  QUnit.test("sort by todo-up alpha-up", (assert) => {
    const slots = search([{
      "agenda-files": "f1",
      "type": "search",
      "text": "node",
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "todo-up alpha-up");
    assert.equal(sortedNodes.length, 7);
    assert.equal(sortedNodes[0].TITLE, "node 3");
    assert.equal(sortedNodes[1].TITLE, "node 5");
    assert.equal(sortedNodes[2].TITLE, "node 7");
    assert.equal(sortedNodes[3].TITLE, "node 2");
    assert.equal(sortedNodes[4].TITLE, "node 1");
    assert.equal(sortedNodes[5].TITLE, "node 6");
    assert.equal(sortedNodes[6].TITLE, "node 4");
  });

  QUnit.test("sort by time", (assert) => {
    const slots = search([{
      "agenda-files": "f2",
      "type": "agenda",
      "agenda-span": 1
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "time-up");
    assert.equal(sortedNodes.length, 4);
    assert.equal(sortedNodes[0].TITLE, "node 3");
    assert.equal(sortedNodes[1].TITLE, "node 7");
    assert.equal(sortedNodes[2].TITLE, "node 2");
    assert.equal(sortedNodes[3].TITLE, "node 5");
  });
  QUnit.test("sort by habit and time", (assert) => {
    const slots = search([{
      "agenda-files": "f2",
      "type": "agenda",
      "agenda-span": 1
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "habit-up time-down");
    assert.equal(sortedNodes.length, 4);
    assert.equal(sortedNodes[0].TITLE, "node 2");
    assert.equal(sortedNodes[1].TITLE, "node 5");
    assert.equal(sortedNodes[2].TITLE, "node 7");
    assert.equal(sortedNodes[3].TITLE, "node 3");
  });


  QUnit.test("agenda sorting with time-up with hours for today", (assert) => {
    const slots = search([{
      "agenda-files": "f3",
      "type": "agenda",
      "agenda-span": 1
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "time-up");
    assert.equal(sortedNodes.length, 8);
    assert.equal(sortedNodes[0].TITLE, "node 3");
    assert.equal(sortedNodes[1].TITLE, "node 1");
    assert.equal(sortedNodes[2].TITLE, "node 4");
    assert.equal(sortedNodes[3].TITLE, "node 2");
    assert.equal(sortedNodes[4].TITLE, "node 6");
    assert.equal(sortedNodes[5].TITLE, "node 5");
    assert.equal(sortedNodes[6].TITLE, "node 8");
    assert.equal(sortedNodes[7].TITLE, "node 7");
  });

  QUnit.test("agenda sorting with time-down with hours for today", (assert) => {
    const slots = search([{
      "agenda-files": "f3",
      "type": "agenda",
      "agenda-span": 1
    }], fileProvider, defaults);
    const sortedNodes = sort(slots[0], "time-down");
    assert.equal(sortedNodes.length, 8);
    assert.equal(sortedNodes[7].TITLE, "node 3");
    assert.equal(sortedNodes[6].TITLE, "node 1");
    assert.equal(sortedNodes[5].TITLE, "node 4");
    assert.equal(sortedNodes[4].TITLE, "node 2");
    assert.equal(sortedNodes[3].TITLE, "node 6");
    assert.equal(sortedNodes[2].TITLE, "node 5");
    assert.equal(sortedNodes[1].TITLE, "node 8");
    assert.equal(sortedNodes[0].TITLE, "node 7");
  });
});
