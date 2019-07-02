(() => {
  const {quoteSplit, shellSplit} = ORG.Utils;

  const arrToObj = (arr) => {
    const obj = {};
    if (!$.isArray(arr)) return obj;
    for (let itemCounter = 0, nitem = arr.length; itemCounter < nitem;) {
      obj[arr[itemCounter++]] = quoteSplit(arr[itemCounter++]);
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

  ORG.Settings = {
    "getAgendaDeadlineLeaders": (settings = getSettingsObj()) => quoteSplit(settings["agenda-deadline-leaders"]),
    "getAgendaScheduleLeaders": (settings = getSettingsObj()) => quoteSplit(settings["agenda-scheduled-leaders"]),
    "getCustomAgendas": (settings = getSettingsObj()) => Object.keys(settings).reduce((agenda, settingName) => {
      if (settingName.startsWith("custom-agenda-")) {
        agenda[settingName.slice(-1)] = settings[settingName]
          .split("\n")
          .map((slotTxt) => arrToObj(shellSplit(slotTxt)));
      }
      return agenda;
    }, {}),
    "getDayNames": (settings = getSettingsObj()) => settings["day-names"].split(/\s+/),
    "getMonthNames": (settings = getSettingsObj()) => settings["month-names"].split(/\s+/),
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
    "getStyles": (...faces) => {
      let allStyles = "<style>";

      for (let faceCounter = 0, nfaces = faces.length; faceCounter < nfaces;) {
        allStyles += $.map(
          faces[faceCounter++],
          (stylesObj, selector) => `.${selector.toLowerCase()}{${$.map(
            stylesObj,
            (style, type) => `${type.toLowerCase()}:${style};`
          ).join("")}}`
        ).join("");
      }
      return allStyles + "</style>";
    },
    "_getStyles": (settings) => {
      const todoFaces = settings["todo-faces"];
      return `<style type='text/css'>
      ${Object.keys(todoFaces)
    .map((key) => {
      const curFace = todoFaces[key];
      return `.todo-${key}{${Object.keys(curFace).map((key) => `${key}:${curFace[key]};`).join("")}}`;
    }).join("")}</style>`;
    },
    "getPriorityLetters": (headings = []) => (headings.PRIORITY || getSettingsObj())["priority-letters"].split(/\s+/),
    "getTodoFaces": (settings = getSettingsObj()) => settings["todo-faces"].split("\n").map((faceTxt) => shellSplit(faceTxt)).reduce((obj, shellSplitArr) => {
      obj[shellSplitArr[0]] = arrToObj(shellSplitArr.slice(1));
      return obj;
    }, {}),
    "getTodoKeywords": (headings = []) => (headings.TODO || getSettingsObj()["todo-keywords"]).replace(/\([^)]*\)/g, "").split(/\s+/),
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
    "setTheme": (theme) => {
      const rootStyles = document.documentElement.style;

      if ($.isPlainObject(theme)) {
        Object.keys(theme)
          .forEach((varName) => rootStyles.setProperty(varName, theme[varName]));
      } else {
        // TODO
      }
    }
  };
})();
