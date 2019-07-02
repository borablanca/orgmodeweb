(() => {
  const FilePrefix = "__orgfiles__";
  const SyncStatus = {
    "SYNC": 0,
    "MODIFIED": 1,
    "CONFLICT": 2,
  };
  const SyncType = {
    "LOCAL": 0,
    "DBOX": 1
  };
  const genId = () => "_" + Math.random().toString(36).substr(2, 9);
  const get = (key) => localStorage.getItem(key);
  const set = (key, _val) => localStorage.setItem(key, _val);
  const del = (key) => localStorage.removeItem(key);

  const saveFileNames = (fileNamesObj) => set(
    FilePrefix,
    JSON.stringify(fileNamesObj)
  );

  const getFileList = () => {
    const fileListStr = get(FilePrefix);

    if (!ORG.Utils.isString(fileListStr)) {
      return [];
    }
    try {
      return JSON.parse(fileListStr);
    } catch (exception) {
      return [];
    }
  };

  const fileExists = (name, syncType = SyncType.LOCAL, syncPath = "") => {
    for (
      let fileIdx = 0, fileList = getFileList(), nfiles = fileList.length, type, file;
      fileIdx < nfiles;
      fileIdx++
    ) {
      file = fileList[fileIdx];
      type = file.sync.type;
      if (
        file.name === name &&
        type === syncType &&
        (type === SyncType.LOCAL || file.sync.path === syncPath)
      ) {
        return true;
      }
    }
    return false;
  };

  /** Update current files in store */
  (() => {
    const curFiles = getFileList();

    if ($.isPlainObject(curFiles)) {
      const files = Object.keys(curFiles).map((oldFileName) => {
        const oldFileObj = curFiles[oldFileName];
        const id = genId();
        const newFileObj = {
          "id": id,
          "name": oldFileName,
          "dml": oldFileObj.dml, // last modified time
          "sync": {
            "stat": oldFileObj.sync, // sync state
            "type": oldFileObj.dbox ? SyncType.DBOX : SyncType.LOCAL, // sync type
            "path": oldFileObj.dbox || "" // sync path
          }
        };
        set(FilePrefix + id, get(FilePrefix + oldFileName));
        del(FilePrefix + oldFileName);
        return newFileObj;
      });
      saveFileNames(files);
    }
  })();

  ORG.Store = {
    "Tokens": {
      "Dropbox": "__dbxtkn__",
      "Settings": "__orgsettings__",
    },
    getFileList,
    SyncStatus,
    SyncType,
    "getToken": (tokenType) => get(tokenType),
    "updateFile": (file, nodes) => {
      if (!file || !file.id || !ORG.Utils.isString(localStorage[FilePrefix + file.id])) {
        throw "Unknown file";
      }
      for (
        let fileIdx = 0, fileList = getFileList(), nfiles = fileList.length, fileId = file.id;
        fileIdx < nfiles;
        fileIdx++
      ) {
        if (fileList[fileIdx].id === fileId) {
          fileList[fileIdx] = file;
          saveFileNames(fileList);
          if (nodes) {
            set(FilePrefix + fileId, ORG.Writer.writeFile(nodes));
          }
          return file;
        }
      }
      throw "File not found";
    },
    "setToken": (tokenType, tokenValue) => tokenType && set(tokenType, tokenValue),
    fileExists,
    "createFile": (name, syncType = SyncType.LOCAL, syncPath = "", nodes = []) => {
      if (!name) throw "File name cannot be empty";
      if (name.match(/[\\/:*?"<>]/)) throw "File name contains illegal characters";
      if (fileExists(name, syncType, syncPath)) {
        throw "There is a file with same name";
      }
      const fileList = getFileList();
      let id = genId();

      while (ORG.Utils.isString(localStorage[FilePrefix + id])) {
        id = genId();
      }
      const file = {
        id,
        name,
        "dml": new Date().getTime(),
        "sync": {
          "stat": SyncStatus.SYNC,
          "type": syncType,
          "path": syncPath
        }
      };
      fileList.push(file);
      saveFileNames(fileList);
      set(FilePrefix + id, ORG.Writer.writeFile(nodes));
      return file;
    },
    "getFileHeadings": (file = {}, settings) => file.id && fileExists(file.name, file.sync.type, file.sync.path) ?
      ORG.Parser.parseFile(
        file.name,
        get(FilePrefix + (ORG.Utils.isString(file) ? file : file.id)),
        settings
      ) : null,
    "getFile": (file) => {
      if (!file || !file.id) throw "Unknown file";
      const fileList = JSON.parse(get(FilePrefix));

      for (
        let fileCounter = 0, nfiles = fileList.length, id = file.id;
        fileCounter < nfiles;
        fileCounter++
      ) {
        if (fileList[fileCounter].name === id) {
          return fileList[fileCounter];
        }
      }
      throw "File not found";
    },
    "getFileContents": (file) => !file || !file.id ? null : get(FilePrefix + file.id),
    "setFileProperty": (file, propertyObj) => {
      const fileNames = getFileList();

      for (
        let fileIdx = 0, nfiles = fileNames.length, id = $.isPlainObject(file) ? file.id : file;
        fileIdx < nfiles;
        fileIdx++
      ) {
        if (fileNames[fileIdx].id === id) {
          Object.assign(fileNames[fileIdx], propertyObj);
          saveFileNames(fileNames);
          return true;
        }
      }
      throw "File not found";
    },
    "deleteFile": (file) => {
      const fileNames = getFileList();
      const fileId = $.isPlainObject(file) ? file.id : file;

      for (let fileCounter = 0, nfiles = fileNames.length; fileCounter < nfiles; fileCounter++) {
        if (fileNames[fileCounter].id === fileId) {
          fileNames.splice(fileCounter, 1);
          saveFileNames(fileNames);
          del(FilePrefix + fileId);
          return true;
        }
      }
      throw "File not found";
    },
    "deleteToken": (tokenType) => {
      del(tokenType);
      return true;
    }
  };
})();
