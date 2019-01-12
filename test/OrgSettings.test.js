QUnit.module("OrgSettings Tests", function(hooks) {
  hooks.beforeEach(function() {
    localStorage.clear();
  });
  hooks.after(function() {
    localStorage.clear();
  });

  QUnit.test("no settings should bring empty object", function(assert) {
    assert.deepEqual(ORG.Settings.getSettings(true), {});
  });
  QUnit.test("get settings", function(assert) {
    ORG.Settings.setSettings({setting1: "value1"});
    assert.deepEqual(ORG.Settings.getSettings(true).setting1, "value1");
  });
  QUnit.test("get custom agendas", function(assert) {
    ORG.Settings.setSettings({
      "custom-agenda-b": "--type agenda --span 3\n--type tags --filter +prj+LEVEL<2 --header 'My Projects'",
    });
    let customAgendas = ORG.Settings.getCustomAgendas();
    assert.equal(Object.keys(customAgendas).length, 1);
    assert.ok(customAgendas.b);
    assert.equal(customAgendas.b[0].type, "agenda");
    assert.equal(customAgendas.b[0].span, "3");
    assert.equal(customAgendas.b[1].type, "tags");
    assert.equal(customAgendas.b[1].filter, "+prj+LEVEL<2");
    assert.equal(customAgendas.b[1].header, "My Projects");
  });

  QUnit.test("get todo keywords", function(assert) {
    let todoKeywords = ORG.Settings.getTodoKeywords(ORG.Settings.getSettings(), {});
    assert.equal(todoKeywords.length, 2);
    assert.equal(todoKeywords[0], "TODO");
    assert.equal(todoKeywords[1], "DONE");
  });

  QUnit.test("get priority letters", function(assert) {
    let priLetters = ORG.Settings.getPriorityLetters(ORG.Settings.getSettings(), {});
    assert.equal(priLetters.length, 3);
    assert.equal(priLetters[0], "A");
    assert.equal(priLetters[1], "B");
    assert.equal(priLetters[2], "C");
  });
});
