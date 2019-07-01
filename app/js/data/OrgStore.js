(() => {
  const parseFile = ORG.Parser.parseFile;
  const writeFile = ORG.Writer.writeFile;
  const FilePrefix = "__orgfiles__";
  const SyncStatus = {
    "SYNC": 0,
    "MODIFIED": 1,
    "CONFLICT": 2,
  };
  const exists = (key) => Object.prototype.hasOwnProperty.call(localStorage, key);
  const get = (key) => localStorage.getItem(key);
  const set = (key, _val) => localStorage.setItem(key, _val);
  const del = (key) => localStorage.removeItem(key);
  const fileExists = (file) => file && exists(
    FilePrefix + ($.isPlainObject(file) ? file.name : file)
  );
  const saveFileNames = (fileNamesObj) => set(
    FilePrefix,
    JSON.stringify(fileNamesObj)
  );

  const getFileList = () => {
    try {
      const files = JSON.parse(get(FilePrefix));
      return $.isPlainObject(files) ? Object.keys(files).map((file) => {
        const fileObj = files[file];
        return {
          "name": file,
          "dbox": fileObj.dbox,
          "dml": fileObj.dml,
          "sync": fileObj.sync
        };
      }) : $.isArray(files) ? files : [];
    } catch (exception) {
      return [];
    }
  };

  const createFile = (file, nodes) => {
    if (fileExists(file)) {
      throw "There is a file with same name!";
    }
    const fileList = getFileList();
    fileList.push(file);
    saveFileNames(fileList);
    set(FilePrefix + file.name, writeFile(nodes));
    return true;
  };

  const updateFile = (file, nodes, oldFile) => {
    const fileNames = getFileList();
    const oldFileName = $.isPlainObject(oldFile) ?
      oldFile.name :
      oldFile;
    const fileNameChanged = file.name !== oldFileName;

    for (let fileIdx = 0, nfiles = fileNames.length;
      fileIdx < nfiles;
      fileIdx++) {
      if (fileNames[fileIdx].name === oldFileName) {
        if (Object.prototype.hasOwnProperty.call(file, "sync")) {
          file.sync = SyncStatus.MODIFIED;
        }
        fileNames[fileIdx] = file;
        saveFileNames(fileNames);
        if (nodes || fileNameChanged) {
          set(
            FilePrefix + file.name,
            nodes ?
              writeFile(nodes) :
              get(FilePrefix + oldFileName)
          );

          if (fileNameChanged) {
            del(FilePrefix + oldFileName);
          }
        }
        return true;
      }
    }
    throw "File not found";
  };

  ORG.Store = {
    "deleteToken": (tokenType) => {
      del(tokenType);
      return true;
    },
    "getToken": (tokenType) => get(tokenType),
    "setToken": (tokenType, tokenValue) => tokenType && set(tokenType, tokenValue),

    fileExists,
    "deleteFile": (file) => {
      const fileNames = getFileList();
      const fileName = $.isPlainObject(file) ? file.name : file;

      for (let fileCounter = 0, nfiles = fileNames.length; fileCounter < nfiles; fileCounter++) {
        if (fileNames[fileCounter].name === fileName) {
          fileNames.splice(fileCounter, 1);
          saveFileNames(fileNames);
          del(FilePrefix + fileName);
          return true;
        }
      }
      throw "File not found";
    },
    "saveFile": (file, nodes, oldFile) => {
      if (!file) throw "Unknown file";
      if (!file.name) throw "File name cannot be empty";
      if (file.name.match(/[\\/:*?"<>]/)) throw "File name contains illegal characters";
      return (oldFile ? updateFile : createFile)(file, nodes, oldFile);
    },
    "getFileHeadings": (file, settings) => file && fileExists(file.name) ?
      parseFile(file.name, get(FilePrefix + file.name), settings) :
      null,
    "getFile": (fileName) => {
      const fileList = JSON.parse(get(FilePrefix));

      for (let fileCounter = 0, nfiles = fileList.length; fileCounter < nfiles; fileCounter++) {
        if (fileList[fileCounter].name === fileName) {
          return fileList[fileCounter];
        }
      }
      throw "File not found";
    },
    "getFileContents": (file) => get(FilePrefix + file.name),
    getFileList,
    "setFileProperty": (file, propertyObj) => {
      const fileNames = getFileList();
      const fileName = $.isPlainObject(file) ? file.name : file;

      for (let fileIdx = 0, nfiles = fileNames.length; fileIdx < nfiles; fileIdx++) {
        if (fileNames[fileIdx].name === fileName) {
          Object.assign(fileNames[fileIdx], propertyObj);
          saveFileNames(fileNames);
          return true;
        }
      }
      throw "File not found";
    },
    SyncStatus,
    "Tokens": {
      "Dropbox": "__dbxtkn__",
      "Settings": "__orgsettings__",
    }
  };
})();
