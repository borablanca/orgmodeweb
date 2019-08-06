/* eslint-disable max-lines */

QUnit.module("OrgSearcher Tests", () => {
  const defaults = ORG.defaults;
  const search = ORG.Searcher.search;
  const SearchItemType = ORG.Searcher.SearchItemType;
  const DAY = 86400000;
  const fileProvider = {
    "getFileList": () => [{"id": 1, "name": "file1"}, {"id": 2, "name": "file2"}],
    "getFileContents": (fid = "") => ({
      "1": `
#+CATEGORY: global-category
#+SEQ_TODO: TODO NEXT | DONE CANC

* [#C] category not properly written doesnt work!  :tag1:
:PROPERTIES:
CATEGORY: cat1
:PROP1: val1
:PROP2: 1
:END:
* [#A] works properly        :tag1:
:PROPERTIES:
:CATEGORY: cat1
:END:
SCHEDULED: <2018-04-03>
** level 2 takes category from its parent
*** NEXT level 3 also takes from level 1
DEADLINE: <2018-04-03>
* again level 1 takes global category <2018-04-03>
* DONE node with done   :tag1:tag2:
* TODO node with todo work also
:PROPERTIES:
:CATEGORY: cat2
:END:`,
      "2": `* scheduled
SCHEDULED: <2018-04-15>
* repeating scheduled (schedule can have leading ':')
:SCHEDULED: <2018-04-15 +1d>
* range schedule
SCHEDULED: <2018-04-15>--<2018-04-17>
* delayed schedule
SCHEDULED: <2018-04-15 -2d>
* deadline
DEADLINE: <2018-04-15>
* timestamp
<2018-04-15>
* spelling mistakes
SCHEDULED <2018-04-15>
* spelling mistakes
SCHEDULED: <2018-04-15
* spelling mistakes
SCHEDULED: <2018-0-15>`
    })[fid]
  };
  QUnit.test("search empty, unknown or no type", (assert) => {
    assert.notOk(search([{}], fileProvider, defaults)[0].length);
    assert.notOk(search([{"type": ""}], fileProvider, defaults)[0].length);
    assert.notOk(search([{"type": "something"}], fileProvider, defaults)[0].length);
    assert.notOk(search([{"type": null}], fileProvider, defaults)[0].length);
    assert.notOk(search([{"type": 1}], fileProvider, defaults)[0].length);
    assert.notOk(search([{"type": "\\"}], fileProvider, defaults)[0].length);
  });
  QUnit.test("agendas", (assert) => { // eslint-disable-line max-statements
    assert.timeout(1000);
    const slots = search([{
      "type": "agenda",
      "start-date": "<2018-04-15 Sun>",
      "agenda-span": 4,
      "agenda-files": "2"
    }, {
      "type": "agenda",
      "agenda-span": 4,
      "agenda-files": "2"
    }], fileProvider, defaults);

    assert.equal(slots.length, 8);
    assert.equal(slots[0].type, "agenda");
    assert.equal(slots[0].length, 7);
    assert.equal(slots[0][0].ID, 0);
    assert.equal(slots[0][0].TYPE, SearchItemType.SCH);
    assert.equal(slots[0][0].OFFSET, 0);
    assert.equal(slots[0][1].ID, 1);
    assert.equal(slots[0][1].TYPE, SearchItemType.SCH);
    assert.equal(slots[0][2].ID, 2);
    assert.equal(slots[0][2].RANGE, "");
    assert.equal(slots[0][2].OFFSET, 0);
    assert.equal(slots[0][3].ID, 2);
    assert.equal(slots[0][3].TYPE, SearchItemType.STAMP);
    assert.equal(slots[0][3].OFFSET, 0);
    assert.equal(slots[0][3].RANGE, "1/3");
    assert.equal(slots[0][4].ID, 4);
    assert.equal(slots[0][4].TYPE, SearchItemType.DL);
    assert.equal(slots[0][4].OFFSET, 0);
    assert.equal(slots[0][5].ID, 5);
    assert.equal(slots[0][5].TYPE, SearchItemType.STAMP);
    assert.equal(slots[0][5].OFFSET, 0);
    assert.equal(slots[0][6].ID, 6);
    assert.equal(slots[0][6].TYPE, SearchItemType.STAMP);
    assert.equal(slots[0][6].OFFSET, 0);

    assert.equal(slots[1].length, 2);
    assert.equal(slots[1][0].ID, 1);
    assert.equal(slots[1][0].TYPE, SearchItemType.SCH);
    assert.equal(slots[1][0].OFFSET, 0);
    assert.equal(slots[1][1].ID, 2);
    assert.equal(slots[1][1].TYPE, SearchItemType.STAMP);
    assert.equal(slots[1][1].RANGE, "2/3");
    assert.equal(slots[1][1].OFFSET, 0);

    assert.equal(slots[2][0].ID, 1);
    assert.equal(slots[2][0].OFFSET, 0);
    assert.equal(slots[2][1].ID, 2);
    assert.equal(slots[2][1].RANGE, "3/3");
    assert.equal(slots[2][1].OFFSET, 0);
    assert.equal(slots[3].length, 1);

    const now = new Date().getTime();
    assert.equal(slots[4].length, 5);
    assert.equal(slots[4][0].ID, 0);
    assert.ok(Math.abs((now - new Date("2018-04-15").getTime()) / DAY - slots[4][0].OFFSET) < 0.99); // sch xn days passed
    assert.equal(slots[4][0].TYPE, SearchItemType.SCH);
    assert.equal(slots[4][1].ID, 1);
    assert.equal(slots[4][1].OFFSET, 0); // sch xn days passed
    assert.equal(slots[4][1].TYPE, SearchItemType.SCH);
    assert.equal(slots[4][2].ID, 2);
    assert.equal(slots[4][2].TYPE, SearchItemType.SCH);
    assert.ok(Math.abs((now - new Date("2018-04-15").getTime()) / DAY - slots[4][2].OFFSET) < 0.99); // sch xn days passed
    assert.equal(slots[4][3].ID, 3);
    assert.equal(slots[4][3].TYPE, SearchItemType.SCH);
    assert.ok(Math.abs((now - new Date("2018-04-15").getTime()) / DAY - slots[4][3].OFFSET) < 0.99); // sch xn days passed
    assert.equal(slots[4][4].ID, 4);
    assert.equal(slots[4][4].TYPE, SearchItemType.DL);
    assert.ok(Math.abs((now - new Date("2018-04-15").getTime()) / DAY - slots[4][4].OFFSET) < 0.99); // dl xn days passed
    assert.equal(slots[5].length, 1);
    assert.equal(slots[5][0].ID, 1); // repeating sch
    assert.equal(slots[5][0].OFFSET, 0); // repeating sch
    assert.equal(slots[6].length, 1);
    assert.equal(slots[6][0].ID, 1); // repeating sch
    assert.equal(slots[6][0].OFFSET, 0); // repeating sch
    assert.equal(slots[7].length, 1);
    assert.equal(slots[7][0].ID, 1); // repeating sch
    assert.equal(slots[7][0].OFFSET, 0); // repeating sch
  });
  QUnit.test("filter search - empty or no filter", (assert) => {
    let slots = search([{
      "type": "search"
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);

    slots = search([{
      "type": "search",
      "filter": "",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });

  QUnit.test("text search", (assert) => {
    let slots = search([{
      "type": "search",
      "text": "global category"
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 4);

    slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "DEADLINE",
      "text": "also",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 3);
  });

  QUnit.test("filter search - misspellings", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "-",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 2", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "*",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 3", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "\\",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 4", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 5", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=\"\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 6", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=\"\"", // eslint-disable-line no-useless-escape
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 7", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=\"*\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 8", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=-",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 9", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=\\",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("filter search - misspellings 10", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "|CATEGORY=\\",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });

  QUnit.test("filter search - CATEGORY 1", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "filter": "CATEGORY=\"cat1\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 3);
    assert.equal(slots[0][0].ID, 1);
    assert.equal(slots[0][1].ID, 2);
    assert.equal(slots[0][2].ID, 3);
  });
  QUnit.test("filter search - CATEGORY 2", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=\"global-category\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 3);
    assert.equal(slots[0][0].ID, 0);
    assert.equal(slots[0][1].ID, 4);
    assert.equal(slots[0][2].ID, 5);
  });
  QUnit.test("filter search - CATEGORY 3", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "|CATEGORY=cat1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 3);
  });
  QUnit.test("filter search - CATEGORY 4", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=cat1|",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 3);
  });
  QUnit.test("filter search - CATEGORY 5", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=cat1|CATEGORY=\"cat2\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 4);
  });

  QUnit.test("filter search - TODO 1", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "TODO=\"DONE\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 5);
  });
  QUnit.test("filter search - TODO 2", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "TODO<>\"DONE\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 6);
  });
  QUnit.test("filter search - TODO 3", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "TODO=DONE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
  });

  QUnit.test("filter search - LEVEL 1", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "LEVEL=2",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 2);
  });
  QUnit.test("filter search - LEVEL 2", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "LEVEL>2",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 3);
  });
  QUnit.test("filter search - LEVEL 3", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "LEVEL>=2",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 2);
    assert.equal(slots[0][0].ID, 2);
  });
  QUnit.test("filter search - LEVEL 4", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "LEVEL<>1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 2);
    assert.equal(slots[0][0].ID, 2);
  });
  QUnit.test("filter search - LEVEL 5", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "LEVEL=\"1\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 5);
  });
  QUnit.test("filter search - LEVEL 6 (also checks #+SEQ_TODO)", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "LEVEL=1|TODO=NEXT",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 6);
  });
  QUnit.test("filter search - LEVEL 7", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "LEVEL=1+TODO=DONE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 5);
  });
  QUnit.test("filter search - LEVEL 8", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "LEVEL>1+TODO<>DONE-CATEGORY<>\"cat1\"",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 2);
    assert.equal(slots[0][0].ID, 2);
  });
  QUnit.test("filter search - LEVEL 9", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "LEVEL<=2+CATEGORY=\"cat1\"|TODO=DONE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 3);
    assert.equal(slots[0][0].ID, 1);
  });

  QUnit.test("filter search - TAG 1", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "tag1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 5);
    assert.equal(slots[0][0].ID, 0);
    assert.equal(slots[0][1].ID, 1);
    assert.equal(slots[0][2].ID, 2);
    assert.equal(slots[0][3].ID, 3);
    assert.equal(slots[0][4].ID, 5);
  });
  QUnit.test("filter search - TAG 2", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "+tag1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 5);
    assert.equal(slots[0][0].ID, 0);
    assert.equal(slots[0][1].ID, 1);
    assert.equal(slots[0][2].ID, 2);
    assert.equal(slots[0][3].ID, 3);
    assert.equal(slots[0][4].ID, 5);
  });
  QUnit.test("filter search - TAG 3", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "-tag1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 2);
    assert.equal(slots[0][0].ID, 4);
    assert.equal(slots[0][1].ID, 6);
  });
  QUnit.test("filter search - TAG 4", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "tag1+tag2",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 5);
  });
  QUnit.test("filter search - TAG 5", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "tag2-tag1|TODO=DONE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 5);
  });

  QUnit.test("filter search - PROPERTY", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "PROP1=val1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 0);
  });
  QUnit.test("filter search - PROPERTY 2", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "PROP2=1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 0);
  });

  QUnit.test("filter search - DEADLINE 1", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "DEADLINE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 3);
  });
  QUnit.test("filter search - DEADLINE 2", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "+DEADLINE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 3);
  });
  QUnit.test("filter search - DEADLINE 3", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "+DEADLINE+TODO=NEXT",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 3);
  });

  QUnit.test("filter search - SCHEDULED 1", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "+SCHEDULED",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 1);
  });
  QUnit.test("filter search - SCHEDULED 2", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "SCHEDULED|DEADLINE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 2);
    assert.equal(slots[0][0].ID, 1);
  });
  QUnit.test("filter search - TIMESTAMP", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "TIMESTAMP",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 4);
  });
  QUnit.test("filter search - TIMESTAMP 2", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "TIMESTAMP+LEVEL=1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 4);
  });
  QUnit.test("filter search - TODO", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "TODO",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 2);
    assert.equal(slots[0][0].ID, 3);
    assert.equal(slots[0][1].ID, 6);
  });
  QUnit.test("filter search - -TODO", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "-TODO",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 4);
    assert.equal(slots[0][0].ID, 0);
    assert.equal(slots[0][1].ID, 1);
    assert.equal(slots[0][2].ID, 2);
    assert.equal(slots[0][3].ID, 4);
  });
  QUnit.test("filter search - DONE", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "DONE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 5);
  });
  QUnit.test("filter search - -DONE", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "search",
      "filter": "-DONE",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 6);
    assert.equal(slots[0][0].ID, 0);
    assert.equal(slots[0][1].ID, 1);
    assert.equal(slots[0][2].ID, 2);
    assert.equal(slots[0][3].ID, 3);
    assert.equal(slots[0][4].ID, 4);
    assert.equal(slots[0][5].ID, 6);
  });
  QUnit.test("filter search - -TODO+CATEGORY+tag", (assert) => {
    const slots = search([{
      "type": "search",
      "filter": "CATEGORY=cat1-TODO+tag1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 2);
    assert.equal(slots[0][0].ID, 1);
    assert.equal(slots[0][1].ID, 2);
  });
  QUnit.test("agenda with filter", (assert) => {
    const slots = search([{
      "agenda-files": "1",
      "type": "agenda",
      "agenda-span": 1,
      "start-date": "<2018-04-03>",
      "filter": "TIMESTAMP|DEADLINE|SCHEDULED",
    }], fileProvider, defaults);
    assert.equal(slots.length, 1);
    assert.equal(slots[0][0].ID, 1);
    assert.equal(slots[0][1].ID, 3);
    assert.equal(slots[0][2].ID, 4);
  });

  QUnit.test("text search 3", (assert) => {
    const slots = search([{
      "type": "search",
      "text": "properly",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 2);
    assert.equal(slots[0][0].ID, 0);
    assert.equal(slots[0][1].ID, 1);
  });
  QUnit.test("text search 4 - no empty text search", (assert) => {
    const slots = search([{
      "type": "search",
      "text": "",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("text search 5 - no empty text search2", (assert) => {
    const slots = search([{
      "type": "search",
      "text": "       ",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("text search 7 - no text field", (assert) => {
    const slots = search([{
      "type": "search",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("text search 8 - null text field", (assert) => {
    const slots = search([{
      "type": "search",
      "text": null,
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 0);
  });
  QUnit.test("text search with filter", (assert) => {
    const slots = search([{
      "type": "search",
      "text": "works",
      "filter": "+tag1",
    }], fileProvider, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].ID, 1);
  });

  QUnit.test("repeater 1", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {"getFileList": () => [""], "getFileContents": () => "\n* repeating\nSCHEDULED: <2018-07-01 +6d>"}, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.SCH);
    const offset = (new Date().setHours(0, 0, 0, 0) - new Date("2018-07-01").setHours(0, 0, 0, 0)) / DAY % 6;
    assert.equal(slots[0][0].OFFSET, offset);

    assert.equal(slots[1].length, offset === 5 ? 1 : 0);
  });
  QUnit.test("repeater 2", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* repeating\nSCHEDULED: <2018-07-01 +2w>"
    }, defaults);
    const offset = (new Date().setHours(0, 0, 0, 0) - new Date("2018-07-01").setHours(0, 0, 0, 0)) / DAY % 14;
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.SCH);
    assert.equal(slots[0][0].OFFSET, offset);

    assert.equal(slots[1].length, offset === 13 ? 1 : 0);
  });
  QUnit.test("repeater 3", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 4,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* repeating\nSCHEDULED: <2019-04-06 +1m>"
    }, defaults);
    let prev;
    const mlStart = new Date("2019-04-06").setHours(0, 0, 0, 0);
    const mlEnd = new Date().setHours(0, 0, 0, 0);

    for (let timeSpan = new Date(mlStart).getMonth() + 1, cur = mlStart;
      mlEnd >= cur;
      timeSpan += 1) {
      prev = cur;
      cur = new Date(mlStart).setMonth(timeSpan);
    }
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.SCH);
    assert.equal(slots[0][0].OFFSET, (mlEnd - prev) / DAY);

    const day = new Date().getDate();
    assert.equal(slots[1].length, day === 5 ? 1 : 0);
    assert.equal(slots[2].length, day === 4 ? 1 : 0);
    assert.equal(slots[3].length, day === 3 ? 1 : 0);
  });
  QUnit.test("repeater 4", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 4,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* repeating\nSCHEDULED: <2019-01-18 +1m>"
    }, defaults);
    let prev;
    const mlStart = new Date("2019-01-18").setHours(0, 0, 0, 0);
    const mlEnd = new Date().setHours(0, 0, 0, 0);

    for (let timeSpan = new Date(mlStart).getMonth() + 1, cur = mlStart;
      mlEnd >= cur;
      timeSpan += 1) {
      prev = cur;
      cur = new Date(mlStart).setMonth(timeSpan);
    }
    const offset = (mlEnd - prev) / DAY;
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.SCH);
    assert.equal(slots[0][0].OFFSET, offset);
    assert.equal(slots[1].length, 0);
    assert.equal(slots[2].length, 0);
  });
  QUnit.test("repeater 5", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 4,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* repeating\nSCHEDULED: <2019-01-31 +1y>"
    }, defaults);
    let prev;
    const mlStart = new Date("2019-01-31").setHours(0, 0, 0, 0);
    const mlEnd = new Date().setHours(0, 0, 0, 0);

    for (let timeSpan = new Date().getYear() + 1, cur = mlStart;
      mlEnd >= cur;
      timeSpan += 1) {
      prev = cur;
      cur = new Date(mlStart).setYear(timeSpan);
    }
    assert.equal(slots.length, 4);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.SCH);
    assert.equal(slots[0][0].OFFSET, (mlEnd - prev) / DAY);
    assert.equal(slots[1].length, 0);
    assert.equal(slots[2].length, 0);
    assert.equal(slots[3].length, 0);
  });

  QUnit.test("deadline 1", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* dl\nDEADLINE: <2018-07-01>"
    }, defaults);
    const mlStart = new Date("2018-07-01").setHours(0, 0, 0, 0);
    const mlEnd = new Date().setHours(0, 0, 0, 0);

    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.DL);
    assert.equal(slots[0][0].OFFSET, (mlEnd - mlStart) / DAY);

    assert.equal(slots[1].length, 0);
  });
  QUnit.test("deadline 2", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* dl\nDEADLINE: <2018-07-16>"
    }, defaults);
    const mlStart = new Date("2018-07-16").setHours(0, 0, 0, 0);
    const mlEnd = new Date().setHours(0, 0, 0, 0);

    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.DL);
    assert.equal(slots[0][0].OFFSET, (mlEnd - mlStart) / DAY);

    assert.equal(slots[1].length, 0);
  });

  QUnit.test("deadline repeater 1", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 3,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* repeating\nDEADLINE: <2019-06-23 +3d>"
    }, defaults);
    const mlStart = new Date("2019-06-23").setHours(0, 0, 0, 0);
    const mlEnd = new Date().setHours(0, 0, 0, 0);
    const offset = (mlEnd - mlStart) / DAY % 3;

    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.DL);
    assert.equal(slots[0][0].OFFSET, offset);

    if (offset === 2) {
      assert.equal(slots[1].length, 1);
      assert.equal(slots[1][0].TYPE, SearchItemType.DL);
      assert.equal(slots[1][0].OFFSET, 0);
    }

    if (offset === 1) {
      assert.equal(slots[2].length, 1);
      assert.equal(slots[2][0].TYPE, SearchItemType.DL);
      assert.equal(slots[2][0].OFFSET, 0);
    }
  });
  QUnit.test("deadline repeater 2", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* repeating\nDEADLINE: <2019-01-31 +3m>"
    }, defaults);
    let prev;
    const mlStart = new Date("2019-01-31").setHours(0, 0, 0, 0);
    const mlEnd = new Date().setHours(0, 0, 0, 0);

    for (let timeSpan = new Date(mlStart).getMonth() + 3, cur = mlStart;
      mlEnd >= cur;
      timeSpan += 3) {
      prev = cur;
      cur = new Date(mlStart).setMonth(timeSpan);
    }
    const offset = (mlEnd - prev) / DAY;
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.DL);
    assert.equal(slots[0][0].OFFSET, offset);

    assert.equal(slots[1].length, 0);
  });
  QUnit.test("deadline repeater 3", (assert) => {
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => "\n* repeating\nDEADLINE: <2050-07-31 +4d>"
    }, defaults);
    assert.equal(slots[0].length, 0);
    assert.equal(slots[1].length, 0);
  });

  QUnit.test("deadline warning 1", (assert) => {
    const date = new Date(new Date().setDate(new Date().getDate() + 3));
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => `\n* repeating\nDEADLINE: <${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)} -2d>`
    }, defaults);
    assert.equal(slots[0].length, 0);
    assert.equal(slots[1].length, 0);
  });
  QUnit.test("deadline warning 2", (assert) => {
    const date = new Date(new Date().setDate(new Date().getDate() + 3));
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => `\n* repeating\nDEADLINE: <${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)} -4d>`
    }, defaults);
    assert.equal(slots[0].length, 1);
    assert.equal(slots[0][0].TYPE, SearchItemType.DL);
    assert.equal(slots[0][0].OFFSET, -3);
    assert.equal(slots[1].length, 0);
  });

  QUnit.test("timestamp 1", (assert) => {
    const date = new Date(new Date().setDate(new Date().getDate() + 1));
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => `\n* non-repeating<${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}>`
    }, defaults);
    assert.equal(slots[0].length, 0);
    assert.equal(slots[1].length, 1);
    assert.equal(slots[1][0].TYPE, SearchItemType.STAMP);
  });
  QUnit.test("timestamp 2", (assert) => {
    const date = new Date(new Date().setDate(new Date().getDate() - 2));
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => `\n* repeating<${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)} +3d>`
    }, defaults);
    assert.equal(slots[0].length, 0);
    assert.equal(slots[1].length, 1);
    assert.equal(slots[1][0].TYPE, SearchItemType.STAMP);
  });
  QUnit.test("inactive timestamp", (assert) => {
    const date = new Date(new Date().setDate(new Date().getDate() + 1));
    const slots = search([{
      "type": "agenda",
      "agenda-span": 2,
    }], {
      "getFileList": () => ["f"],
      "getFileContents": () => `* inactive[${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}]`
    }, $.extend({}, defaults, {
      "agenda-include-inactive-timestamps": 1,
    }));
    assert.equal(slots[0].length, 0);
    assert.equal(slots[1].length, 1);
    assert.equal(slots[1][0].ID, 0);
    assert.equal(slots[1][0].TYPE, SearchItemType.ISTAMP);
  });

  QUnit.test("search time should be at least 30k nodes/sec @i7-6700HQ", (assert) => {
    var done = assert.async();
    $.get("./OrgParser.test.1000nodes.org", (orgFileTxt) => {
      const p0 = performance.now();
      search([{
        "type": "search",
        "filter": "CATEGORY<>\"cat1\"+TODO<>\"DONE\"+TODO<>\"CANC\"+DEADLINE<\"<today>\"-SCHEDULED",
      }], {
        "getFileList": () => ["f"],
        "getFileContents": () => orgFileTxt
      }, defaults);
      assert.ok(performance.now() - p0 <= 33.3333);
      done();
    }).fail(() => {
      assert.ok(1);
      done();
    });
  });
});
