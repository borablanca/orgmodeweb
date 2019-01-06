QUnit.module("OrgWriter Tests", function() {
  QUnit.test("should return null if no nodes given as parameter", function(assert) {
    assert.equal(ORG.Writer.write(), "");
  });
  QUnit.test("should return null if string is given as parameter", function(assert) {
    assert.equal(ORG.Writer.write("test"), "");
  });
  QUnit.test("should return null if object is given as parameter", function(assert) {
    assert.equal(ORG.Writer.write({}), "");
  });
  QUnit.test("should return null given empty nodes", function(assert) {
    assert.equal(ORG.Writer.write([]), "");
  });
  QUnit.test("should return empty string if nodes has empty objects", function(assert) {
    assert.equal(ORG.Writer.write([{}]), "");
    assert.equal(ORG.Writer.write([{}, {}]), "\n");
    assert.equal(ORG.Writer.write([{}, {}, {}]), "\n\n");
  });
  QUnit.test("should return as expected only first node", function(assert) {
    assert.equal(ORG.Writer.write([{text: ""}]), "");
    assert.equal(ORG.Writer.write([{text: null}]), "");
    assert.equal(ORG.Writer.write([{text: "test"}]), "test\n");
    assert.equal(ORG.Writer.write([{CATEGORY: "cat1", text: "test"}]), "#+CATEGORY: cat1\ntest\n");
    assert.equal(ORG.Writer.write([{CATEGORY: "", text: "test"}]), "test\n");
    assert.equal(ORG.Writer.write([{CATEGORY: "", text: "\ntest"}]), "\ntest\n");
  });

  QUnit.test("should return as expected", function(assert) {
    assert.equal(ORG.Writer.write([{}, {lvl: "1", todo: "", title: "test"}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", todo: "SMTH", title: "test"}]), "* SMTH test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test"}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", todo: "SMTH", pri: "A"}]), "* SMTH [#A]\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", todo: "SMTH", pri: "A", title: "test"}]), "* SMTH [#A] test\n");
    assert.equal(ORG.Writer.write([{text: "settings"}, {lvl: "1", todo: "", title: "test"}]), "settings\n* test\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      todo: "SMTH",
      pri: "A",
      title: "test",
      tags: ":tag1:",
    }]), "* SMTH [#A] test\t\t:tag1:\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      pri: "A",
      title: "test",
      tags: ":tag1:",
    }]), "* [#A] test\t\t:tag1:\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      todo: "SMTH",
      title: "test",
      tags: ":tag1:",
    }]), "* SMTH test\t\t:tag1:\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      todo: "SMTH",
      pri: "A",
      tags: ":tag1:",
    }]), "* SMTH [#A]\t\t:tag1:\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      todo: "SMTH",
      pri: "A",
      title: "test",
      tags: ":tag1:",
    }]), "* SMTH [#A] test\t\t:tag1:\n");
  });

  QUnit.test("should return as expected with schedule", function(assert) {
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      todo: "SMTH",
      pri: "A",
      title: "test",
      tags: ":tag1:",
      sch: {
        ml: 1525294800000,
      },
    }]), "* SMTH [#A] test\t\t:tag1:\nSCHEDULED: <2018-05-03 Thu>\n");
  });

  QUnit.test("should return as expected with schedule with hours", function(assert) {
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        hs: "12:00",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        he: "12:00",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        hs: "12:00",
        he: "14:00",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00-14:00>\n");
  });

  QUnit.test("should return as expected with schedule with repeater", function(assert) {
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        r: "+",
        rmin: "1d",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu +1d>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        rmin: "1d",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        r: "+",
        rmin: "1d",
        rmax: "2d",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu +1d/2d>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        hs: "12:00",
        he: "14:00",
        r: "+",
        rmin: "1d",
        rmax: "2d",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00-14:00 +1d/2d>\n");
  });

  QUnit.test("should return as expected with schedule with warning", function(assert) {
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        w: "1w",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu -1w>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        hs: "12:00",
        he: "14:00",
        w: "1w",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00-14:00 -1w>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        r: "+",
        rmin: "1d",
        rmax: "2d",
        w: "1w",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu +1d/2d -1w>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        r: "+",
        rmin: "1d",
        w: "1w",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu +1d -1w>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        hs: "12:00",
        he: "14:00",
        r: "+",
        rmin: "1d",
        rmax: "2d",
        w: "1w",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu 12:00-14:00 +1d/2d -1w>\n");
  });

  QUnit.test("should return as expected with schedule with next timestamp", function(assert) {
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        n: "",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        n: "test",
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        n: null,
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        n: {ml: 1525381200000},
      },
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>--<2018-05-04 Fri>\n");
  });

  QUnit.test("should return as expected with deadline", function(assert) {
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      dl: {ml: 1525294800000},
    }]), "* test\nDEADLINE: <2018-05-03 Thu>\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {ml: 1525294800000},
      dl: {ml: 1525294800000},
    }]), "* test\nSCHEDULED: <2018-05-03 Thu> DEADLINE: <2018-05-03 Thu>\n");
  });

  QUnit.test("should return as expected with properties", function(assert) {
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", props: ""}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", props: null}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", props: []}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", props: {}}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", props: {prop1: "val1"}}]), "* test\n:PROPERTIES:\n:prop1: val1\n:END:\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", props: {prop1: "val1", prop2: "val2"}}]), "* test\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      sch: {
        ml: 1525294800000,
        n: {ml: 1525381200000},
      },
      props: {prop1: "val1", prop2: "val2"},
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>--<2018-05-04 Fri>\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      dl: {ml: 1525294800000},
      sch: {
        ml: 1525294800000,
        n: {ml: 1525381200000},
      },
      props: {prop1: "val1", prop2: "val2"},
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>--<2018-05-04 Fri> DEADLINE: <2018-05-03 Thu>\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\n");
  });

  QUnit.test("should return as expected with logbook", function(assert) {
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", logbook: ""}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", logbook: null}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", logbook: {}}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", logbook: []}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", logbook: ["log1"]}]), "* test\n:LOGBOOK:\nlog1\n:END:\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", logbook: ["log1", "log2"]}]), "* test\n:LOGBOOK:\nlog1\nlog2\n:END:\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      logbook: ["log1", "log2"],
      props: {prop1: "val1", prop2: "val2"},
    }]), "* test\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\n:LOGBOOK:\nlog1\nlog2\n:END:\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      dl: {ml: 1525294800000},
      sch: {
        ml: 1525294800000,
        n: {ml: 1525381200000},
      },
      logbook: ["log1", "log2"],
      props: {prop1: "val1", prop2: "val2"},
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>--<2018-05-04 Fri> DEADLINE: <2018-05-03 Thu>\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\n:LOGBOOK:\nlog1\nlog2\n:END:\n");
  });

  QUnit.test("should return as expected with text", function(assert) {
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", text: ""}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", text: null}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", text: []}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", text: {}}]), "* test\n");
    assert.equal(ORG.Writer.write([{}, {lvl: "1", title: "test", text: "text"}]), "* test\ntext\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      text: "text",
      props: {prop1: "val1", prop2: "val2"},
    }]), "* test\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\ntext\n");
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      text: "text",
      dl: {ml: 1525294800000},
      sch: {
        ml: 1525294800000,
        n: {ml: 1525381200000},
      },
      logbook: ["log1", "log2"],
      props: {prop1: "val1", prop2: "val2"},
    }]), "* test\nSCHEDULED: <2018-05-03 Thu>--<2018-05-04 Fri> DEADLINE: <2018-05-03 Thu>\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\n:LOGBOOK:\nlog1\nlog2\n:END:\ntext\n");
  });

  QUnit.test("should return as expected with multiple nodes", function(assert) {
    assert.equal(ORG.Writer.write([{text: "setting"},
      {lvl: "1", title: "test1", text: ""},
      {lvl: "2", title: "test2", text: ""}]), "setting\n* test1\n** test2\n");
    assert.equal(ORG.Writer.write([{text: "setting"},
      {lvl: "1", title: "test1", dl: {ml: 1525294800000}, text: ""},
      {lvl: "2", title: "test2", props: {prop1: "val1", prop2: "val2"}, text: "text1"}]), "setting\n* test1\nDEADLINE: <2018-05-03 Thu>\n** test2\n:PROPERTIES:\n:prop1: val1\n:prop2: val2\n:END:\ntext1\n");
  });

  QUnit.test("write proper CLOSED", function(assert) {
    assert.equal(ORG.Writer.write([{}, {
      lvl: "1",
      title: "test",
      cls: {
        ml: 1532693134504,
        hs: "15:05",
      },
    }]), "* test\nCLOSED: [2018-07-27 Fri 15:05]\n");
  });

  QUnit.test("write time of a 1000 nodes file should be < 0.1s", function(assert) {
    var done = assert.async();
    $.get("./lib/OrgParser.test.1000nodes.org", function(orgfile) {
      let nodes = ORG.Parser.parse("test.org", orgfile, ORG.defaults);
      let t0 = performance.now();
      ORG.Writer.write(nodes);
      assert.lt(performance.now() - t0, 100); // not more than 0.1s/1000node
      done();
    });
  });
});
