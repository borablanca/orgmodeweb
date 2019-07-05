(() => {
  const FilePrefix = "__orgfiles__";
  const SyncStatus = {
    "SYNC": 0,
    "MODIFIED": 1,
    "CONFLICT": 2,
    "INSYNC": 3,
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
        syncType === SyncType.LOCAL && file.name === name ||
        syncType === SyncType.DBOX && type === syncType && file.sync.path === syncPath
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
        throw `There is a file with same name${syncType === SyncType.DBOX ? " and dropbox path" : ""}`;
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
          "stat": SyncStatus[syncType ? "SYNC" : "LOCAL"],
          "type": syncType,
          "path": syncPath
        }
      };
      fileList.push(file);
      saveFileNames(fileList);
      set(FilePrefix + id, ORG.Writer.writeFile(nodes));
      return file;
    },
    "getFileHeadings": (fileId, settings) => {
      const fileList = JSON.parse(get(FilePrefix));

      for (
        let fileIdx = 0, nfiles = fileList.length, curFile;
        fileIdx < nfiles;
        fileIdx++
      ) {
        curFile = fileList[fileIdx];
        if (curFile.id === fileId) {
          return ORG.Parser.parseFile(
            curFile.name,
            get(FilePrefix + fileId),
            settings
          );
        }
      }
      throw "File not found";
    },
    "getFileById": (fileId) => {
      if (!fileId) throw "Unknown file ID";
      const fileList = JSON.parse(get(FilePrefix));

      for (
        let fileCounter = 0, nfiles = fileList.length;
        fileCounter < nfiles;
        fileCounter++
      ) {
        if (fileList[fileCounter].id === fileId) {
          return fileList[fileCounter];
        }
      }
      throw "File not found";
    },
    "getFileContents": (fileId) => fileId ? get(FilePrefix + fileId) : null,
    "setFileProperty": (fileId, propertyObj) => {
      const fileNames = getFileList();

      for (
        let fileIdx = 0, nfiles = fileNames.length;
        fileIdx < nfiles;
        fileIdx++
      ) {
        if (fileNames[fileIdx].id === fileId) {
          Object.assign(fileNames[fileIdx], propertyObj);
          saveFileNames(fileNames);
          return true;
        }
      }
      throw "File not found";
    },
    "deleteFile": (fileId) => {
      const fileNames = getFileList();

      for (let fileIdx = 0, nfiles = fileNames.length; fileIdx < nfiles; fileIdx++) {
        if (fileNames[fileIdx].id === fileId) {
          fileNames.splice(fileIdx, 1);
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
