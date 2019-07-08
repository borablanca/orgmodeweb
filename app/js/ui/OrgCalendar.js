ORG.Calendar = {
  "getDayNames": (settings = ORG.Settings.getSettingsObj()) => settings["day-names"].split(/\s+/),
  "getMonthNames": (settings = ORG.Settings.getSettingsObj()) => settings["month-names"].split(/\s+/),
};
