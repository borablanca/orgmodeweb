(() => {
  const {quoteSplit, shellSplit} = ORG.Utils;

  const arrToObj = (arr) => {
    const obj = {};
    if (!$.isArray(arr)) return obj;
    for (let itemCounter = 0, nitem = arr.length; itemCounter < nitem;) {
      obj[arr[itemCounter++]] = quoteSplit(arr[itemCounter++])[0];
    }
    return obj;
  };
  const saveSettings = (settings) => ORG.Store.setToken(ORG.Store.Tokens.Settings, JSON.stringify(settings));

  const getSettingsObj = (userSettingsOnly) => {
    try {
      const storeVal = ORG.Store.getToken(ORG.Store.Tokens.Settings);
      let settings = storeVal ? JSON.parse(storeVal) : {};
      settings = $.isPlainObject(settings.s) ? settings.s : settings; // for update, to be removed later
      return userSettingsOnly ? settings : Object.assign({}, ORG.defaults, settings);
    } catch (exception) {
      return ORG.defaults;
    }
  };

  const THEMES = {
    "light": {
      "background": "#fffeee",
      "button": "#c1c1c1",
      "buttonActive": "#e1e1e1",
      "buttonHover": "#d1d1d1",
      "buttonForeground": "#111",
      "headingHover": "#f3f3f3",
      "dim": "#ccc",
      "firstLevel": "#00f",
      "secondLevel": "#CC4F35",
      "thirdLevel": "#AB3FFF",
      "text": "#000",
      "sync": "#00f",
      "insync": "#e0c602"
    }
  };

  ORG.Settings = {
    "getAgendaDeadlineLeaders": (settings = getSettingsObj()) => quoteSplit(settings["agenda-deadline-leaders"]),
    "getAgendaScheduleLeaders": (settings = getSettingsObj()) => quoteSplit(settings["agenda-scheduled-leaders"]),
    "getCustomAgendas": (settings = getSettingsObj()) => Object.keys(settings).reduce((agenda, settingName) => {
      if (settingName.startsWith("custom-agenda-")) {
        agenda[settingName.slice(-1)] = settings[settingName]
          .split("\n")
          .map((slotTxt) => arrToObj(shellSplit(slotTxt).slice(1)));
      }
      return agenda;
    }, {}),
    "getDayNames": (settings = ORG.Settings.getSettingsObj()) => settings["calendar-day-names"].split(/\s+/),
    "getMonthNames": (settings = ORG.Settings.getSettingsObj()) => settings["calendar-month-names"].split(/\s+/),
    "getSettings": (userSettingsOnly) => {
      const defaultSettings = ORG.defaults;
      const userSettings = getSettingsObj(1);

      if (userSettingsOnly) {
        return Object.keys(userSettings).sort().map((settingName) => ({
          "name": settingName,
          "value": userSettings[settingName]
        }));
      }
      return Object.keys(Object.assign({}, defaultSettings, userSettings)).sort().map((settingName) => {
        const userSettingValue = userSettings[settingName] || "";

        return Object.prototype.hasOwnProperty.call(userSettings, settingName) ? {
          "name": settingName,
          "value": userSettingValue,
          "default": Object.prototype.hasOwnProperty.call(defaultSettings, settingName)
        } : {
          "name": settingName,
          "value": defaultSettings[settingName],
          "default": true
        };
      });
    },
    "getSettingsObj": getSettingsObj,
    "getStyles": (settings = getSettingsObj()) => {
      const todoFaces = settings["todo-faces"].split("\n").map((faceTxt) => shellSplit(faceTxt)).reduce((obj, shellSplitArr) => {
        obj[shellSplitArr[0]] = arrToObj(shellSplitArr.slice(1));
        return obj;
      }, {});
      return `<style>${$.map(
        todoFaces,
        (face, selector) => `.${selector.toUpperCase()}{${$.map(
          face,
          (style, type) => `${type.toLowerCase()}:${style};`
        ).join("")}}`
      ).join("")}</style>`;
    },
    "getPriorityLetters": (settings = getSettingsObj()) => settings["priority-letters"].split(/\s+/),
    "getTodoKeywords": (settings = getSettingsObj()) => settings["todo-keywords"].replace(/\([^)]*\)/g, "").split(/\s+/),
    "deleteSetting": (setting) => {
      const settings = getSettingsObj(1);
      const settingName = setting.name;
      const defaults = ORG.defaults;
      delete settings[settingName];
      saveSettings(settings);
      return Object.prototype.hasOwnProperty.call(defaults, settingName) ? {
        "name": settingName,
        "value": defaults[settingName],
        "default": true
      } : true;
    },
    "saveSetting": (setting, oldSetting) => {
      if (!setting.name) throw "Setting name cannot be empty";
      const storeValue = ORG.Store.getToken(ORG.Store.Tokens.Settings);
      let curSettings = storeValue ? JSON.parse(storeValue) : {};
      curSettings = $.isPlainObject(curSettings.s) ? curSettings.s : curSettings; // for update, to be removed later
      if (oldSetting) {
        delete curSettings[oldSetting.name];
      }
      if (setting.value !== ORG.defaults[setting.name]) {
        curSettings[setting.name] = setting.value;
      }
      saveSettings(curSettings);
      return true;
    },
    "resetSettings": () => saveSettings({}),
    "loadTheme": (theme) => {
      const rootStyles = document.documentElement.style;

      if ($.isPlainObject(theme)) {
        Object.keys(theme)
          .forEach((varName) => rootStyles.setProperty("--" + varName, theme[varName]));
        ORG.defaults["todo-faces"] = "TODO --color #000\nDONE --color #0f0";
        if (theme.buttonForeground) {
          ORG.Icons.setDefault({"color": theme.buttonForeground});
        }
      } else {
        [
          "background",
          "button",
          "buttonActive",
          "buttonHover",
          "headingHover",
          "cursor",
          "cursorEdit",
          "dim",
          "link",
          "firstLevel",
          "secondLevel",
          "thirdLevel",
          "text",
          "timestamp",
          "sync",
          "conflict",
          "insync"
        ].map((varName) => rootStyles.removeProperty("--" + varName));
        ORG.Icons.setDefault({"color": "#eee"});
      }
    }
  };
  ORG.Settings.loadTheme(THEMES[ORG.Store.getToken(ORG.Store.Tokens.Theme)]);
})();
