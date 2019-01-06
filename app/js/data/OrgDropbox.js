(() => {
  const tokenPrefix = "__dbxtkn__";
  const SYNC_STATUS = {
    SYNC: 0,
    MODIFIED: 1,
    CONFLICT: 2,
  };

  const getDropbox = () => {
    let token = ORG.Store.store(tokenPrefix);
    if (token) return new Dropbox.Dropbox({accessToken: token});
    location.href = new Dropbox.Dropbox({clientId: "h3xyb8gqqxvounb"})
      .getAuthenticationUrl("https://orgmodeweb.com/");
    return null;
  };

  ORG.Dropbox = {
    SYNC: SYNC_STATUS,

    // filePath : path on dropbox eg: /emacs/orgfiles/
    // fileName : name of the file with extension eg: file.org
    // cb       : callback function after fetching file from dropbox
    // err      : error function if error occurs during fetch
    // sync     : if true sync existing fileName, else fetching new file
    getFile: function(filePath, fileName, cb, err, sync) {
      let dbox = getDropbox();
      if (dbox) {
        dbox.filesDownload({path: filePath}).then((data) => {
          let reader = new FileReader();
          reader.addEventListener("loadend", (e) => {
            const text = e.target.result;
            try {
              ORG.Store.setFile(fileName, ORG.Parser.parse(fileName, text, ORG.Settings.getSettings()), sync ? fileName : "")
                .setFileProperty(fileName, {
                  dbox: filePath,
                  dml: new Date(data.server_modified).getTime(), // last dropbox timestamp
                  sync: SYNC_STATUS.SYNC,
                });
              cb(SYNC_STATUS.SYNC);
            } catch (e) {
              err && err(e);
            }
          });
          reader.readAsText(data.fileBlob);
        }).catch(() => err && err());
      }
      return this;
    },

    listFiles: function(path, cursor, fn, err) {
      let dbox = getDropbox();
      dbox && (cursor ? dbox.filesListFolderContinue({cursor: cursor}) :
        dbox.filesListFolder({path: path, include_media_info: true})).then(fn).catch(() => err && err());
      return this;
    },

    setDropbox: function() {
      let match = location.hash.match(/access_token=([^&]*)/);
      if (match) ORG.Store.store(tokenPrefix, match[1]);
      return this;
    },

    setFile: function(fileName, fileData, fileContents, cb, err) {
      let dbox = getDropbox();
      if (dbox) {
        dbox.filesUpload({
          path: fileData.dbox,
          contents: fileContents,
          mode: {".tag": "overwrite"},
          autorename: true,
        }).then((metadata) => {
          ORG.Store.setFileProperty(fileName, {
            dml: new Date(metadata.server_modified).getTime(),
            sync: SYNC_STATUS.SYNC,
          });
          cb(SYNC_STATUS.SYNC);
        }).catch(() => err && err());
      }
      return this;
    },

    syncFile: function(fileName, fileData, cb, err) {
      let dbox = getDropbox();
      if (dbox && fileData.dbox) { // both ORG and the file are linked to dropbox
        dbox.filesGetMetadata({path: fileData.dbox}).then((data) => {
          let modifiedDate = new Date(data.server_modified).getTime();
          if (modifiedDate > fileData.dml) { // dbox file is changed
            if (fileData.sync) { // also client file is changed or conflicted
              ORG.Store.setFileProperty(fileName, {sync: SYNC_STATUS.CONFLICT});
              cb(SYNC_STATUS.CONFLICT);
            } else { // update local file
              this.getFile(fileData.dbox, fileName, cb, err, true);
            }
          } else if (fileData.sync === SYNC_STATUS.MODIFIED) { // client file is changed
            this.setFile(fileName, fileData, ORG.Store.getFileContents(fileName), cb, err);
          } else cb(SYNC_STATUS.SYNC);
        }).catch(() => err());
      }
      return this;
    },

    unlink: function() {
      delete window.localStorage[tokenPrefix];
      return ORG;
    },
  };
  ORG.Dropbox.setDropbox();
})();
