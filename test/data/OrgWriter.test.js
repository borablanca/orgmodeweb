/* eslint-disable max-lines */
const writeFile = ORG.Writer.writeFile;
QUnit.module("OrgWriter Tests", () => {
  QUnit.test("should return empty string for non-array input", (assert) => {
    assert.equal(writeFile(), "");
    assert.equal(writeFile("test"), "");
    assert.equal(writeFile({}), "");
    assert.equal(writeFile(Object.assign([], {"TEXT": ""})), "");
  });
  QUnit.test("should return null if string is given as parameter", (assert) => {
    assert.equal(writeFile("test"), "");
  });
  QUnit.test("should return null if object is given as parameter", (assert) => {
    assert.equal(writeFile({}), "");
  });
  QUnit.test("should return null given empty nodes", (assert) => {
    assert.equal(writeFile([]), "");
  });
  QUnit.test("should return empty string if nodes has empty objects", (assert) => {
    assert.equal(writeFile([{"TEXT": [], "PROPS": {}}]), "");
    assert.equal(writeFile([{"TEXT": [], "PROPS": {}}, {"TEXT": [], "PROPS": {}}]), "");
    assert.equal(writeFile([{"TEXT": [], "PROPS": {}}, {"TEXT": [], "PROPS": {}}, {"TEXT": [], "PROPS": {}}]), "");
  });
  QUnit.test("should return as expected only first node", (assert) => {
    assert.equal(writeFile(Object.assign([], {"TEXT": ""})), "");
    assert.equal(writeFile(Object.assign([], {"TEXT": null})), "");
    assert.equal(writeFile(Object.assign([], {"TEXT": "test"})), "test");
    assert.equal(writeFile(Object.assign([], {"CATEGORY": "cat1", "TEXT": "#+CATEGORY: cat1\ntest"})), "#+CATEGORY: cat1\ntest");
    assert.equal(writeFile(Object.assign([], {"CATEGORY": "", "TEXT": "test"})), "test");
  });

  QUnit.test("writeFile should return as expected", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TODO": "",
      "TITLE": "test",
      "TEXT": [],
      "PROPS": {}
    }]), "* test");
    assert.equal(writeFile([{
      "LVL": "1",
      "TODO": "SMTH",
      "TITLE": "test",
      "TEXT": [],
      "PROPS": {}
    }]), "* SMTH test");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "PROPS": {}
    }]), "* test");
    assert.equal(writeFile([{
      "LVL": "1",
      "TODO": "SMTH",
      "PRI": "A",
      "TEXT": [],
      "PROPS": {}
    }]), "* SMTH [#A]");
    assert.equal(writeFile([{
      "LVL": "2",
      "TODO": "SMTH",
      "PRI": "A",
      "TITLE": "test",
      "TEXT": [],
      "PROPS": {}
    }]), "** SMTH [#A] test");
    assert.equal(writeFile(Object.assign([{
      "LVL": "1",
      "TODO": "",
      "TITLE": "test",
      "TEXT": [],
      "PROPS": {}
    }], {"TEXT": "settings"})), "settings\n* test");
    assert.equal(writeFile([{
      "LVL": "1",
      "TODO": "SMTH",
      "PRI": "A",
      "TITLE": "test",
      "TAGS": ":tag1:",
      "TEXT": [],
      "PROPS": {}
    }]), "* SMTH [#A] test\t\t:tag1:");
    assert.equal(writeFile([{
      "LVL": "1",
      "PRI": "A",
      "TITLE": "test",
      "TAGS": ":tag1:",
      "TEXT": [],
      "PROPS": {}
    }]), "* [#A] test\t\t:tag1:");
    assert.equal(writeFile([{
      "LVL": "1",
      "TODO": "SMTH",
      "TITLE": "test",
      "TAGS": ":tag1:",
      "TEXT": [],
      "PROPS": {}
    }]), "* SMTH test\t\t:tag1:");
    assert.equal(writeFile([{
      "LVL": "1",
      "TODO": "SMTH",
      "PRI": "A",
      "TAGS": ":tag1:",
      "TEXT": [],
      "PROPS": {}
    }]), "* SMTH [#A]\t\t:tag1:");
    assert.equal(writeFile([{
      "LVL": "1",
      "TODO": "SMTH",
      "PRI": "A",
      "TITLE": "test",
      "TAGS": ":tag1:",
      "TEXT": [],
      "PROPS": {}
    }]), "* SMTH [#A] test\t\t:tag1:");
  });

  QUnit.test("writeFile should return as expected with schedule", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TODO": "SMTH",
      "PRI": "A",
      "TITLE": "test",
      "TAGS": ":tag1:",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
      },
      "PROPS": {}
    }]), "* SMTH [#A] test\t\t:tag1:\nSCHEDULED: <2018-05-03 Thu>");
  });

  QUnit.test("should return as expected with schedule with hours", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "hs": "12:00",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "he": "12:00",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "hs": "12:00",
        "he": "14:00",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00-14:00>");
  });

  QUnit.test("should return as expected with schedule with repeater", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "r": "+",
        "rmin": "1d",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu +1d>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "rmin": "1d",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "r": "+",
        "rmin": "1d",
        "rmax": "2d",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu +1d/2d>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "hs": "12:00",
        "he": "14:00",
        "r": "+",
        "rmin": "1d",
        "rmax": "2d",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00-14:00 +1d/2d>");
  });

  QUnit.test("should return as expected with schedule with warning", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "w": "1w",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu -1w>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "hs": "12:00",
        "he": "14:00",
        "w": "1w",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00-14:00 -1w>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "r": "+",
        "rmin": "1d",
        "rmax": "2d",
        "w": "1w",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu +1d/2d -1w>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "r": "+",
        "rmin": "1d",
        "w": "1w",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu +1d -1w>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "hs": "12:00",
        "he": "14:00",
        "r": "+",
        "rmin": "1d",
        "rmax": "2d",
        "w": "1w",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00-14:00 +1d/2d -1w>");
  });

  QUnit.test("should return as expected with schedule with next timestamp", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "n": "",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "n": "test",
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "n": null,
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "n": {"ml": 1525381200000},
      },
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>-<2018-05-04 Fri>");
  });

  QUnit.test("should return as expected with deadline", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "DEADLINE": {"ml": 1525294800000},
      "TEXT": [],
      "PROPS": {}
    }]), "* test\nDEADLINE: <2018-05-03 Thu>");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "SCHEDULED": {"ml": 1525294800000},
      "DEADLINE": {"ml": 1525294800000},
      "TEXT": [],
      "PROPS": {}
    }]), "* test\nSCHEDULED: <2018-05-03 Thu> DEADLINE: <2018-05-03 Thu>");
  });

  QUnit.test("should return as expected with properties", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "PROPS": {}
    }]), "* test");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "PROPS": {"prop1": "val1"}
    }]), "* test\n:PROPERTIES:\n:prop1: val1\n:END:");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "PROPS": {"prop1": "val1", "prop2": "val2"}
    }]), "* test\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "SCHEDULED": {
        "ml": 1525294800000,
        "n": {"ml": 1525381200000},
      },
      "PROPS": {"prop1": "val1", "prop2": "val2"},
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>-<2018-05-04 Fri>\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "DEADLINE": {"ml": 1525294800000},
      "SCHEDULED": {
        "ml": 1525294800000,
        "n": {"ml": 1525381200000},
      },
      "PROPS": {"prop1": "val1", "prop2": "val2"},
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>-<2018-05-04 Fri> DEADLINE: <2018-05-03 Thu>\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:");
  });

  QUnit.test("should return as expected with text", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": ["log1"],
      "PROPS": {}
    }]), "* test\nlog1");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": ["log1", "log2"],
      "PROPS": {}
    }]), "* test\nlog1\nlog2");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": ["log1", "log2"],
      "PROPS": {"prop1": "val1", "prop2": "val2"},
    }]), "* test\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\nlog1\nlog2");
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "DEADLINE": {"ml": 1525294800000},
      "SCHEDULED": {
        "ml": 1525294800000,
        "n": {"ml": 1525381200000},
      },
      "TEXT": ["log1", "log2"],
      "PROPS": {"prop1": "val1", "prop2": "val2"},
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>-<2018-05-04 Fri> DEADLINE: <2018-05-03 Thu>\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\nlog1\nlog2");
  });

  QUnit.test("should return as expected with multiple nodes", (assert) => {
    assert.equal(writeFile(Object.assign([
      {"LVL": "1", "TITLE": "test1", "TEXT": [], "PROPS": {}},
      {"LVL": "2", "TITLE": "test2", "TEXT": [], "PROPS": {}}], {"TEXT": "setting"})),
    "setting\n* test1\n** test2");
    assert.equal(writeFile(Object.assign([
      {"LVL": "1", "TITLE": "test1", "DEADLINE": {"ml": 1525294800000}, "TEXT": [""], "PROPS": {}},
      {"LVL": "2", "TITLE": "test2", "PROPS": {"prop1": "val1", "prop2": "val2"}, "TEXT": ["text1"]}], {"TEXT": "setting"})),
    "setting\n* test1\nDEADLINE: <2018-05-03 Thu>\n\n** test2\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\ntext1");
  });

  QUnit.test("write proper CLOSED", (assert) => {
    assert.equal(writeFile([{
      "LVL": "1",
      "TITLE": "test",
      "TEXT": [],
      "CLOSED": {
        "ml": 1532693134504,
        "hs": "15:05",
      },
      "PROPS": {}
    }]), "* test\nCLOSED: [2018-07-27 Fri 15:05]");
  });

  QUnit.test("write time should be at least 100k nodes/sec @i7-6700HQ", (assert) => {
    var done = assert.async();
    $.get("./OrgParser.test.1000nodes.org", (orgFileTxt) => {
      const nodes = ORG.Parser.parseFile("", orgFileTxt, ORG.defaults);
      const p0 = performance.now();
      writeFile(nodes);
      assert.ok(performance.now() - p0 < 10);
      done();
    }).fail(() => {
      assert.ok(1);
      done();
    });
  });
});
