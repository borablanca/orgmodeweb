QUnit.module("OrgSettings Tests", (hooks) => {
  hooks.beforeEach(() => localStorage.clear());
  hooks.after(() => localStorage.clear());

  QUnit.test("no settings should bring empty object", (assert) => {
    assert.deepEqual(ORG.Settings.getSettings(true), []);
  });
  QUnit.test("set and get a setting", (assert) => {
    ORG.Settings.saveSetting({"name": "setting1", "value": "value1"});
    const setting = ORG.Settings.getSettings(true)[0];
    assert.equal(setting.name, "setting1");
    assert.equal(setting.value, "value1");
  });
  QUnit.test("get custom agendas", (assert) => {
    const settings = {
      "custom-agenda-b": "--type agenda --agenda-span 3\n--type search --filter +prj+LEVEL<2 --text smth --header 'My Projects'",
    };
    const customAgendas = ORG.Settings.getCustomAgendas(settings);
    assert.equal(Object.keys(customAgendas).length, 1);
    assert.ok(customAgendas.b);
    assert.equal(customAgendas.b[0].type, "agenda");
    assert.equal(customAgendas.b[0]["agenda-span"], "3");
    assert.equal(customAgendas.b[1].type, "search");
    assert.equal(customAgendas.b[1].text, "smth");
    assert.equal(customAgendas.b[1].filter, "+prj+LEVEL<2");
    assert.equal(customAgendas.b[1].header, "My Projects");
  });
  QUnit.test("get todo keywords", (assert) => {
    const todoKeywords = ORG.Settings.getTodoKeywords();
    assert.equal(todoKeywords.length, 3);
    assert.equal(todoKeywords[0], "TODO");
    assert.equal(todoKeywords[1], "|");
    assert.equal(todoKeywords[2], "DONE");
  });
  QUnit.test("get priority letters", (assert) => {
    const priLetters = ORG.Settings.getPriorityLetters();
    assert.equal(priLetters.length, 3);
    assert.equal(priLetters[0], "A");
    assert.equal(priLetters[1], "B");
    assert.equal(priLetters[2], "C");
  });
});
