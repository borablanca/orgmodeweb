(() => {
  const settingsPrefix = "__orgsettings__";
  const arrToObj = (arr) =>
    (arr.constructor === Array) ? arr.reduce((obj, el, idx) => {
      if (idx % 2 === 1) obj[arr[idx - 1].slice(2)] = el;
      return obj;
    }, {}) : {};

  ORG.Settings = {
    getCustomAgendas: function() {
      let result = {};
      let settings = this.getSettings();
      Object.keys(settings).map((key) => {
        if (key.startsWith("custom-agenda-")) {
          result[key.slice(-1)] = settings[key].split("\n").map((str) => arrToObj($.shellSplit(str)));
        }
      });
      return result;
    },

    getSettings: (userSettingsOnly) => {
      try {
        let storeVal = ORG.Store.store(settingsPrefix);
        let settings = storeVal ? JSON.parse(storeVal).s : {};
        return userSettingsOnly ? settings : Object.assign({}, ORG.defaults, settings);
      } catch (e) {
        return ORG.defaults;
      }
    },

    getStyles: (settings) => {
      let todoFaces = settings["todo-faces"];
      return `<style type='text/css'>
      ${Object.keys(todoFaces).map((key) => {
    let curFace = todoFaces[key];
    return `.todo-${key}{${Object.keys(curFace).map((key) => `${key}:${curFace[key]};`).join("")}}`;
  }).join("")}</style>`;
    },

    getTodoFaces: (settings) => settings["todo-faces"].split("\n").map((x) => $.shellSplit(x)).reduce((obj, x) => {
      obj[x[0]] = arrToObj(x.slice(1));
      return obj;
    }, {}),

    getTodoKeywords: (settings, settingsNode) => (settingsNode.TODO || settingsNode.SEQ_TODO || settingsNode.TYP_TODO || settings["todo-keywords"])
      .replace(/\([^)]*\)/g, "").split(" ").filter(Boolean),

    setSettings: function(newSettings, extraFields) {
      let storeVal = ORG.Store.store(settingsPrefix);
      let curSettings = storeVal ? JSON.parse(storeVal) : {s: {}};
      curSettings.s = newSettings;
      ORG.Store.store(settingsPrefix, JSON.stringify(Object.assign(curSettings, extraFields)));
      return this;
    },
  };
})();
