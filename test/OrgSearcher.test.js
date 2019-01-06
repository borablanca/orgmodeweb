QUnit.module("OrgSearcher Tests", function() {
  QUnit.test("search empty, unknown or no type", function(assert) {
    let nodes;
    assert.notOk(ORG.Searcher.search(nodes, [{}])[0].slots);
    assert.notOk(ORG.Searcher.search(nodes, [{type: ""}])[0].slots);
    assert.notOk(ORG.Searcher.search(nodes, [{type: "something"}])[0].slots);
    assert.notOk(ORG.Searcher.search(nodes, [{type: undefined}])[0].slots);
    assert.notOk(ORG.Searcher.search(nodes, [{type: null}])[0].slots);
    assert.notOk(ORG.Searcher.search(nodes, [{type: 1}])[0].slots);
    assert.notOk(ORG.Searcher.search(nodes, [{type: "\\"}])[0].slots);
  });

  let settings = ORG.defaults;
  // settings["todo-keywords"] = settings["todo-keywords"].split(" ");

  QUnit.test("agendas", function(assert) {
    assert.timeout(1000);
    assert.expect(63);
    let done = assert.async(1);
    $.get("./OrgSearcher.test.org", function(orgfile) {
      let nodes = ORG.Parser.parse("test.org", orgfile, ORG.defaults);
      let agenda = ORG.Searcher.search(nodes, [{
        "type": "agenda",
        "start-date": "<2018-04-15 Sun>",
        "agenda-span": 4,
      }, {
        "type": "agenda",
        "agenda-span": 4,
      }], settings);

      let slots = agenda[0].slots;

      assert.equal(slots.length, 4);
      assert.equal(slots[0].type, ORG.Searcher.slotTypes.AGENDA);
      assert.equal(slots[0].nodes.length, 7);
      assert.equal(slots[0].nodes[0].id, 1);
      assert.equal(slots[0].nodes[0].type, ORG.Searcher.itemTypes.SCH);
      assert.equal(slots[0].nodes[0].offset, undefined);
      assert.equal(slots[0].nodes[1].id, 2);
      assert.equal(slots[0].nodes[1].type, ORG.Searcher.itemTypes.SCH);
      assert.equal(slots[0].nodes[2].id, 3);
      assert.equal(slots[0].nodes[2].range, undefined);
      assert.equal(slots[0].nodes[2].offset, undefined);
      assert.equal(slots[0].nodes[3].id, 3);
      assert.equal(slots[0].nodes[3].type, ORG.Searcher.itemTypes.STAMP);
      assert.equal(slots[0].nodes[3].offset, undefined);
      assert.equal(slots[0].nodes[3].range, "1/3");
      assert.equal(slots[0].nodes[4].id, 5);
      assert.equal(slots[0].nodes[4].type, ORG.Searcher.itemTypes.DL);
      assert.equal(slots[0].nodes[4].offset, undefined);
      assert.equal(slots[0].nodes[5].id, 6);
      assert.equal(slots[0].nodes[5].type, ORG.Searcher.itemTypes.STAMP);
      assert.equal(slots[0].nodes[5].offset, undefined);
      assert.equal(slots[0].nodes[6].id, 7);
      assert.equal(slots[0].nodes[6].type, ORG.Searcher.itemTypes.STAMP);
      assert.equal(slots[0].nodes[6].offset, undefined);

      assert.equal(slots[1].nodes.length, 2);
      assert.equal(slots[1].nodes[0].id, 2);
      assert.equal(slots[1].nodes[0].type, ORG.Searcher.itemTypes.SCH);
      assert.equal(slots[1].nodes[0].offset, 0);
      assert.equal(slots[1].nodes[1].id, 3);
      assert.equal(slots[1].nodes[1].type, ORG.Searcher.itemTypes.STAMP);
      assert.equal(slots[1].nodes[1].range, "2/3");
      assert.equal(slots[1].nodes[1].offset, undefined);

      assert.equal(slots[2].nodes[0].id, 2);
      assert.equal(slots[2].nodes[0].offset, 0);
      assert.equal(slots[2].nodes[1].id, 3);
      assert.equal(slots[2].nodes[1].range, "3/3");
      assert.equal(slots[2].nodes[1].offset, undefined);
      assert.equal(slots[3].nodes.length, 1);


      slots = agenda[1].slots;

      assert.equal(slots[0].nodes.length, 5);
      assert.equal(slots[0].nodes[0].id, 1);
      assert.close(slots[0].nodes[0].offset, ($.now() - new Date("2018-04-15").getTime()) / 86400000, 0.99); // sch xn days passed
      assert.equal(slots[0].nodes[0].type, ORG.Searcher.itemTypes.SCH);
      assert.equal(slots[0].nodes[1].id, 2);
      assert.equal(slots[0].nodes[1].offset, 0); // sch xn days passed
      assert.equal(slots[0].nodes[1].type, ORG.Searcher.itemTypes.SCH);
      assert.equal(slots[0].nodes[2].id, 3);
      assert.equal(slots[0].nodes[2].type, ORG.Searcher.itemTypes.SCH);
      assert.close(slots[0].nodes[2].offset, ($.now() - new Date("2018-04-15").getTime()) / 86400000, 0.99); // sch xn days passed
      assert.equal(slots[0].nodes[3].id, 4);
      assert.equal(slots[0].nodes[3].type, ORG.Searcher.itemTypes.SCH);
      assert.close(slots[0].nodes[3].offset, ($.now() - new Date("2018-04-15").getTime()) / 86400000, 0.99); // sch xn days passed
      assert.equal(slots[0].nodes[4].id, 5);
      assert.equal(slots[0].nodes[4].type, ORG.Searcher.itemTypes.DL);
      assert.close(slots[0].nodes[4].offset, ($.now() - new Date("2018-04-15").getTime()) / 86400000, 0.99); // dl xn days passed
      assert.equal(slots[1].nodes.length, 1);
      assert.equal(slots[1].nodes[0].id, 2); // repeating sch
      assert.equal(slots[1].nodes[0].offset, 0); // repeating sch
      assert.equal(slots[2].nodes.length, 1);
      assert.equal(slots[2].nodes[0].id, 2); // repeating sch
      assert.equal(slots[2].nodes[0].offset, 0); // repeating sch
      assert.equal(slots[3].nodes.length, 1);
      assert.equal(slots[3].nodes[0].id, 2); // repeating sch
      assert.equal(slots[3].nodes[0].offset, 0); // repeating sch
      done();
    });
  });

  let orgfile = `
#+CATEGORY: global-category
#+SEQ_TODO: TODO NEXT | DONE CANC

* category not properly written doesnt work!
:PROPERTIES:
CATEGORY: cat1
:PROP1: val1
:PROP2: 1
:END:
* works properly        :tag1:
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
:END:`;

  let nodes = ORG.Parser.parse("test.org", orgfile, settings);
  let globOpts = $.extend({}, settings, {
    "todo-keywords": "TODO NEXT | DONE",
  });
  let result;
  QUnit.test("filter search - empty or no filter", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);

    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("type search", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "search",
      text: "global category",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 5);

    result = ORG.Searcher.search(nodes, [{
      type: "search",
      filter: "DEADLINE",
      text: "also",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 4);
  });

  QUnit.test("filter search - misspellings", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "-",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 2", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "*",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 3", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "\\",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 4", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 5", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=\"\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 6", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=\"\"", // eslint-disable-line no-useless-escape
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 7", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=\"*\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 8", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=-",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 9", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=\\",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - misspellings 10", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "|CATEGORY=\\",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });

  QUnit.test("filter search - CATEGORY 1", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=\"cat1\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 3);
    assert.equal(result[0].nodes[0].id, 2);
    assert.equal(result[0].nodes[1].id, 3);
    assert.equal(result[0].nodes[2].id, 4);
  });

  QUnit.test("filter search - CATEGORY 2", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=\"global-category\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 3);
    assert.equal(result[0].nodes[0].id, 1);
    assert.equal(result[0].nodes[1].id, 5);
  });

  QUnit.test("filter search - CATEGORY 3", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "|CATEGORY=cat1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 3);
  });

  QUnit.test("filter search - CATEGORY 4", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=cat1|",
    }], globOpts);
    assert.equal(result[0].nodes.length, 3);
  });

  QUnit.test("filter search - CATEGORY 5", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=cat1|CATEGORY=\"cat2\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 4);
  });
  QUnit.test("filter search - TODO 1", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "TODO=\"DONE\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 6);
  });
  QUnit.test("filter search - TODO 2", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "TODO<>\"DONE\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 6);
  });
  QUnit.test("filter search - TODO 2", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "TODO=DONE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
  });
  QUnit.test("filter search - LEVEL 1", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL=2",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 3);
  });
  QUnit.test("filter search - LEVEL 2", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL>2",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 4);
  });
  QUnit.test("filter search - LEVEL 3", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL>=2",
    }], globOpts);
    assert.equal(result[0].nodes.length, 2);
    assert.equal(result[0].nodes[0].id, 3);
  });
  QUnit.test("filter search - LEVEL 4", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL<>1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 2);
    assert.equal(result[0].nodes[0].id, 3);
  });
  QUnit.test("filter search - LEVEL 5", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL=\"1\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 5);
  });
  QUnit.test("filter search - LEVEL 6 (also checks #+SEQ_TODO)", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL=1|TODO=NEXT",
    }], globOpts);
    assert.equal(result[0].nodes.length, 6);
  });
  QUnit.test("filter search - LEVEL 7", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL=1+TODO=DONE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 6);
  });
  QUnit.test("filter search - LEVEL 8", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL>1+TODO<>DONE-CATEGORY<>\"cat1\"",
    }], globOpts);
    assert.equal(result[0].nodes.length, 2);
    assert.equal(result[0].nodes[0].id, 3);
  });
  QUnit.test("filter search - LEVEL 9", function(assert) {
    result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "LEVEL<=2+CATEGORY=\"cat1\"|TODO=DONE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 3);
    assert.equal(result[0].nodes[0].id, 2);
  });
  QUnit.test("filter search - TAG 1", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "tag1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 4);
    assert.equal(result[0].nodes[0].id, 2);
    assert.equal(result[0].nodes[1].id, 3);
    assert.equal(result[0].nodes[2].id, 4);
    assert.equal(result[0].nodes[3].id, 6);
  });

  QUnit.test("filter search - TAG 2", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "+tag1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 4);
    assert.equal(result[0].nodes[0].id, 2);
    assert.equal(result[0].nodes[1].id, 3);
    assert.equal(result[0].nodes[2].id, 4);
    assert.equal(result[0].nodes[3].id, 6);
  });

  QUnit.test("filter search - TAG 3", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "-tag1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 3);
    assert.equal(result[0].nodes[0].id, 1);
    assert.equal(result[0].nodes[1].id, 5);
    assert.equal(result[0].nodes[2].id, 7);
  });

  QUnit.test("filter search - TAG 4", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "tag1+tag2",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 6);
  });

  QUnit.test("filter search - TAG 5", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "tag2-tag1|TODO=DONE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 6);
  });
  QUnit.test("filter search - PROPERTY", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "PROP1=val1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 1);
  });
  QUnit.test("filter search - PROPERTY 2", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "PROP2=1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 1);
  });
  QUnit.test("filter search - DEADLINE 1", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "DEADLINE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 4);
  });
  QUnit.test("filter search - DEADLINE 2", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "+DEADLINE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 4);
  });
  QUnit.test("filter search - DEADLINE 3", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "+DEADLINE+TODO=NEXT",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 4);
  });
  QUnit.test("filter search - SCHEDULED 1", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "+SCHEDULED",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 2);
  });
  QUnit.test("filter search - SCHEDULED 2", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "SCHEDULED|DEADLINE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 2);
    assert.equal(result[0].nodes[0].id, 2);
  });
  QUnit.test("filter search - TIMESTAMP", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "TIMESTAMP",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 5);
  });
  QUnit.test("filter search - TIMESTAMP 2", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "TIMESTAMP+LEVEL=1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 5);
  });
  QUnit.test("filter search - TODO", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "TODO",
    }], globOpts);
    assert.equal(result[0].nodes.length, 2);
    assert.equal(result[0].nodes[0].id, 4);
    assert.equal(result[0].nodes[1].id, 7);
  });
  QUnit.test("filter search - -TODO", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "-TODO",
    }], globOpts);
    assert.equal(result[0].nodes.length, 4);
    assert.equal(result[0].nodes[0].id, 1);
    assert.equal(result[0].nodes[1].id, 2);
    assert.equal(result[0].nodes[2].id, 3);
    assert.equal(result[0].nodes[3].id, 5);
  });
  QUnit.test("filter search - DONE", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "DONE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 6);
  });
  QUnit.test("filter search - -DONE", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "-DONE",
    }], globOpts);
    assert.equal(result[0].nodes.length, 6);
    assert.equal(result[0].nodes[0].id, 1);
    assert.equal(result[0].nodes[1].id, 2);
    assert.equal(result[0].nodes[2].id, 3);
    assert.equal(result[0].nodes[3].id, 4);
    assert.equal(result[0].nodes[4].id, 5);
    assert.equal(result[0].nodes[5].id, 7);
  });
  QUnit.test("filter search - -TODO+CATEGORY+tag", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "tags",
      filter: "CATEGORY=cat1-TODO+tag1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 2);
    assert.equal(result[0].nodes[0].id, 2);
    assert.equal(result[0].nodes[1].id, 3);
  });
  QUnit.test("agenda with filter", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      "type": "agenda",
      "agenda-span": 1,
      "start-date": "<2018-04-03>",
      "filter": "TIMESTAMP|DEADLINE|SCHEDULED",
    }], globOpts);
    assert.equal(result[0].slots.length, 1);
    assert.equal(result[0].slots[0].nodes.length, 3);
    assert.equal(result[0].slots[0].nodes[0].id, 2);
    assert.equal(result[0].slots[0].nodes[1].id, 4);
    assert.equal(result[0].slots[0].nodes[2].id, 5);
  });
  // QUnit.test("text search", function(assert) {
  //   let result = ORG.Searcher.search(nodes, [{
  //     type: "text",
  //     text: "properly work",
  //   }], globOpts);
  //   assert.equal(result[0].nodes.length, 2);
  //   assert.equal(result[0].nodes[0].id, 1);
  //   assert.equal(result[0].nodes[1].id, 2);
  // });
  // QUnit.test("text search 2", function(assert) {
  //   let result = ORG.Searcher.search(nodes, [{
  //     type: "text",
  //     text: "work properly",
  //   }], globOpts);
  //   assert.equal(result[0].nodes.length, 2);
  //   assert.equal(result[0].nodes[0].id, 1);
  //   assert.equal(result[0].nodes[1].id, 2);
  // });
  // QUnit.test("text search 3", function(assert) {
  //   let result = ORG.Searcher.search(nodes, [{
  //     type: "text",
  //     text: "work \properly", // eslint-disable-line no-useless-escape
  //   }], globOpts);
  //   assert.equal(result[0].nodes.length, 2);
  //   assert.equal(result[0].nodes[0].id, 1);
  //   assert.equal(result[0].nodes[1].id, 2);
  // });
  QUnit.test("text search 4 - no empty text search", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "search",
      text: "",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });
  QUnit.test("text search 5 - no empty text search2", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "search",
      text: "       ",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });
  // QUnit.test("text search 6 - no single letter search", function(assert) {
  //   let result = ORG.Searcher.search(nodes, [{
  //     type: "search",
  //     text: "   a    ",
  //   }], globOpts);
  //   assert.equal(result[0].nodes.length, 0);
  // });
  QUnit.test("text search 7 - no text field", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "search",
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });
  QUnit.test("text search 8 - null text field", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "search",
      text: null,
    }], globOpts);
    assert.equal(result[0].nodes.length, 0);
  });
  QUnit.test("text search with filter", function(assert) {
    let result = ORG.Searcher.search(nodes, [{
      type: "search",
      text: "works",
      filter: "+tag1",
    }], globOpts);
    assert.equal(result[0].nodes.length, 1);
    assert.equal(result[0].nodes[0].id, 2);
  });

  QUnit.test("repeater tests 1", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nSCHEDULED: <2018-07-01 +6d>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-14>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-14").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[1].today = false;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.SCH);
    assert.equal(result[0].slots[0].nodes[0].offset, 1);

    assert.equal(result[0].slots[1].nodes.length, 0);
  });

  QUnit.test("repeater tests 2", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nSCHEDULED: <2018-07-01 +2w>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-14>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-14").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.SCH);
    assert.equal(result[0].slots[0].nodes[0].offset, 13);

    assert.equal(result[0].slots[1].nodes.length, 1);
  });

  QUnit.test("repeater tests 3", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nSCHEDULED: <2018-04-03 +1m>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-05-06>",
      "agenda-span": 4,
    }], globOpts);
    result.todayMl = new Date("2018-05-06").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.SCH);
    assert.equal(result[0].slots[0].nodes[0].offset, 3);

    assert.equal(result[0].slots[1].nodes.length, 0);
    assert.equal(result[0].slots[2].nodes.length, 0);
    assert.equal(result[0].slots[3].nodes.length, 0);
  });

  QUnit.test("repeater tests 4", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nSCHEDULED: <2018-01-31 +1m>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-03-04>",
      "agenda-span": 4,
    }], globOpts);
    result.todayMl = new Date("2018-03-04").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.SCH);
    assert.equal(result[0].slots[0].nodes[0].offset, 1);

    assert.equal(result[0].slots[1].nodes.length, 0);
    assert.equal(result[0].slots[2].nodes.length, 0);
    assert.equal(result[0].slots[3].nodes.length, 0);
  });

  QUnit.test("repeater tests 5", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nSCHEDULED: <2018-01-31 +1y>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2019-03-14>",
      "agenda-span": 4,
    }], globOpts);
    result.todayMl = new Date("2019-03-14").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.SCH);
    assert.equal(result[0].slots[0].nodes[0].offset, 42);

    assert.equal(result[0].slots[1].nodes.length, 0);
    assert.equal(result[0].slots[2].nodes.length, 0);
    assert.equal(result[0].slots[3].nodes.length, 0);
  });

  QUnit.test("deadline test 1", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nDEADLINE: <2018-07-01>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-14>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-14").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[1].today = false;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.DL);
    assert.equal(result[0].slots[0].nodes[0].offset, 13);

    assert.equal(result[0].slots[1].nodes.length, 0);
  });

  QUnit.test("deadline test 2", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nDEADLINE: <2018-07-16>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-14>",
      "agenda-span": 2,
    }], settings);
    result.todayMl = new Date("2018-07-14").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[1].today = false;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, settings);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.DL);
    assert.equal(result[0].slots[0].nodes[0].offset, -2);

    assert.equal(result[0].slots[1].nodes.length, 0);
  });

  QUnit.test("deadline repeater test 1", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nDEADLINE: <2018-06-11 +3d>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-06-13>",
      "agenda-span": 3,
    }], globOpts);
    result.todayMl = new Date("2018-06-13").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result[0].slots[2].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.DL);
    assert.equal(result[0].slots[0].nodes[0].offset, 2);

    assert.equal(result[0].slots[1].nodes.length, 1);
    assert.equal(result[0].slots[1].nodes[0].type, ORG.Searcher.itemTypes.DL);
    assert.equal(result[0].slots[1].nodes[0].offset, 0);

    assert.equal(result[0].slots[2].nodes.length, 0);
  });

  QUnit.test("deadline repeater test 2", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nDEADLINE: <2018-01-31 +3m>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-15>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-15").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[1].today = false;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.DL);
    assert.equal(result[0].slots[0].nodes[0].offset, 75);

    assert.equal(result[0].slots[1].nodes.length, 0);
  });

  QUnit.test("deadline repeater test 3", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating\nDEADLINE: <2018-07-31 +4d>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-15>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-15").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 0);
    assert.equal(result[0].slots[1].nodes.length, 0);
  });

  QUnit.test("deadline warning test 1", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* no-warning\nDEADLINE: <2018-07-18 -2d>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-15>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-15").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[1].today = false;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 0);
    assert.equal(result[0].slots[1].nodes.length, 0);
  });
  QUnit.test("deadline warning test 2", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* warning\nDEADLINE: <2018-07-18 -4d>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-15>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-15").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[1].today = false;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.DL);
    assert.equal(result[0].slots[0].nodes[0].offset, -3);
    assert.equal(result[0].slots[1].nodes.length, 0);
  });

  QUnit.test("timestamp test 1", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* non-repeating<2018-07-16>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-15>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-15").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 0);
    assert.equal(result[0].slots[1].nodes.length, 1);
    assert.equal(result[0].slots[1].nodes[0].type, ORG.Searcher.itemTypes.STAMP);
  });

  QUnit.test("timestamp test 2", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org", "\n* repeating<2018-07-14 +2d>", settings);
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-15>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-15").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, globOpts);
    assert.equal(result[0].slots[0].nodes.length, 0);
    assert.equal(result[0].slots[1].nodes.length, 1);
    assert.equal(result[0].slots[1].nodes[0].type, ORG.Searcher.itemTypes.STAMP);
  });

  QUnit.test("timestamp test 3", function(assert) {
    let nodes2 = ORG.Parser.parse("test.org",
      "\n* inactive[2018-07-14]\n* inactive2[2018-07-15]",
      $.extend({}, settings, {
        "agenda-include-inactive-timestamps": true,
      }));
    result = ORG.Searcher.search(nodes2, [{
      "type": "agenda",
      "start-date": "<2018-07-14>",
      "agenda-span": 2,
    }], globOpts);
    result.todayMl = new Date("2018-07-14").setHours(0, 0, 0, 0);
    result[0].slots[0].today = true;
    result[0].slots[0].nodes = [];
    result[0].slots[1].nodes = [];
    result = ORG.Searcher.search(nodes2, result, $.extend({}, settings, {
      "agenda-include-inactive-timestamps": true,
    }));
    assert.equal(result[0].slots[0].nodes.length, 1);
    assert.equal(result[0].slots[0].nodes[0].id, 1);
    assert.equal(result[0].slots[0].nodes[0].type, ORG.Searcher.itemTypes.ISTAMP);
    assert.equal(result[0].slots[1].nodes.length, 1);
    assert.equal(result[0].slots[1].nodes[0].id, 2);
    assert.equal(result[0].slots[1].nodes[0].type, ORG.Searcher.itemTypes.ISTAMP);
  });

  QUnit.test("search time of a 1000 nodes file should be less than 0.1s", function(assert) {
    var done = assert.async();
    $.get("./lib/OrgParser.test.1000nodes.org", function(orgfile) {
      let nodes = ORG.Parser.parse("test.org", orgfile, settings);
      let t0 = performance.now();
      ORG.Searcher.search(nodes, [{
        type: "tags",
        filter: "CATEGORY<>\"cat1\"+TODO<>\"DONE\"+TODO<>\"CANC\"+DEADLINE<\"<today>\"-SCHEDULED",
      }], settings);
      assert.lt(performance.now() - t0, 100); // not more than 0.1s/1000node
      done();
    });
  });
});
