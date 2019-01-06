(() => {
  const filePrefix = "__orgfiles__";
  const store = (key, val = null) => (typeof val === "string") ? localStorage[key] = val : localStorage[key];

  ORG.Store = {
    deleteFile: function(fileName) {
      if (!fileName) return this;
      let fileNames = this.getFileNames();
      ((fileName.constructor === Array) ? fileName : [fileName]).map((file) => {
        delete fileNames[file];
        delete localStorage[filePrefix + file];
      });
      this.setFileNames(fileNames);
      return this;
    },
    fileExists: function(fileName) {
      return this.getFileNames().hasOwnProperty(fileName);
    },
    getFile: function(fileName, settings) {
      return this.fileExists(fileName) ?
        ORG.Parser.parse(fileName, store(filePrefix + fileName), settings) : null;
    },
    getFileContents: (fileName) => store(filePrefix + fileName),
    getFileNames: () => {
      try {
        return JSON.parse(store(filePrefix));
      } catch (e) {
        return {};
      }
    },
    setFile: function(fileName, nodes, oldFileName) {
      if (!fileName) throw "File name cannot be empty";
      if ((fileName + "").match(/[\\/:*?"<>]/)) throw "File name contains illegal characters";
      let fileNames = this.getFileNames();
      if (oldFileName) { // edit file
        if (fileName !== oldFileName) { // change only file name
          fileNames[fileName] = fileNames[oldFileName];
          localStorage[filePrefix + fileName] = localStorage[filePrefix + oldFileName];
          delete fileNames[oldFileName];
          delete localStorage[filePrefix + oldFileName];
          this.setFileNames(fileNames);
        } else { // change in nodes
          fileNames[fileName].sync = ORG.Dropbox.SYNC.MODIFIED;
          this.setFileNames(fileNames);
          store(filePrefix + fileName,
            (nodes ?
              ORG.Writer.write(nodes) :
              localStorage[filePrefix + oldFileName]));
        }
      } else { // new file
        if (fileNames.hasOwnProperty(fileName)) throw "There is already a file with the same name";
        fileNames[fileName] = {};
        this.setFileNames(fileNames).store(filePrefix + fileName, ORG.Writer.write(nodes || []));
      }
      return this;
    },
    setFileNames: function(fileNamesObj) {
      store(filePrefix, JSON.stringify(fileNamesObj));
      return this;
    },
    setFileProperty: function(fileName, opts) {
      let fileNames = this.getFileNames();
      Object.assign(fileNames[fileName], opts);
      this.setFileNames(fileNames);
      return this;
    },
    store: store,
  };
})();
