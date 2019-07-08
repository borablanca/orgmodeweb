(() => {
  const store = ORG.Store;
  const SyncStatus = store.SyncStatus;
  const ConnectionError = "Failed to connect to Dropbox";
  const NotLinkedError = "You haven't linked to Dropbox!";
  const UnknownPathError = "Can't sync file";
  const AuthorizationError = "Unauthorized Dropbox account!";

  // check dropbox token at start
  ((match) => {
    if (match) {
      store.setToken(store.Tokens.Dropbox, match[1]);
      $("body").orgNotify({"message": "Dropbox account added successfully"});
    }
  })(location.hash.match(/access_token=([^&]*)/));

  const DropboxFns = {
    "getDropbox": () => {
      const token = store.getToken(store.Tokens.Dropbox);
      if (token) return new Dropbox.Dropbox({"accessToken": token});
      location.href = new Dropbox.Dropbox({"clientId": "h3xyb8gqqxvounb"}).getAuthenticationUrl("http://localhost:3000");
      return null;
    },

    /**
     *
     * @param {string} filePath path of the file in dropbox
     * @param {function} successFn callback fn to call after getting the file
     * @param {function} failFn error fn to call if error occurs
     */
    "fetchFile": (filePath, successFn, failFn) => {
      if (!filePath || !ORG.Utils.isString(filePath)) return failFn(UnknownPathError);
      const dbox = DropboxFns.getDropbox();
      if (!dbox) return failFn(NotLinkedError);
      return dbox.filesDownload({"path": filePath}).then((metadata) => {
        const reader = new FileReader();
        reader.addEventListener("loadend", (loadEndObj) => successFn(loadEndObj.target.result, metadata));
        reader.readAsText(metadata.fileBlob);
      }).catch(() => failFn(ConnectionError));
    },

    /**
     *
     * @param {*} filePath path of the file in dropbox
     * @param {*} fileText file contents
     * @param {*} successFn callback fn to call after fetching file list from dropbox
     * @param {*} failFn error fn to call if error occurs
     */
    "uploadFile": (filePath, fileText, successFn, failFn) => {
      if (!filePath || !ORG.Utils.isString(filePath)) return failFn(UnknownPathError);
      const dbox = DropboxFns.getDropbox();
      if (!dbox) return failFn(NotLinkedError);
      return dbox.filesUpload({
        "path": filePath,
        "contents": fileText,
        "mode": {".tag": "overwrite"},
        "autorename": true,
      }).then(successFn)
        .catch(() => failFn(ConnectionError));
    },

    /**
     *
     * @param {string} folderPath dropbox folder to list files from
     * @param {cursor} cursor dropbox cursor returned if more folders exists in dropbox
     * @param {function} successFn callback fn to call after fetching file list from dropbox
     * @param {function} failFn error fn to call if error occurs
     */
    "getFileList": (folderPath, cursor, successFn, failFn) => { // eslint-disable-line consistent-return
      if (!ORG.Utils.isString(folderPath)) return failFn(UnknownPathError);
      const dbox = DropboxFns.getDropbox();
      if (!dbox) return failFn(NotLinkedError);
      (cursor ? dbox.filesListFolderContinue({"cursor": cursor}) : dbox.filesListFolder({"path": folderPath, "include_media_info": true}))
        .then(successFn)
        .catch((exception) => {
          if (exception.status === 401) {
            ORG.Dropbox.unlink();
            ORG.route("#");
            failFn(AuthorizationError);
          } else failFn(ConnectionError);
        });
    },

    /**
     *
     * @param {object} file local metadata of file
     * @param {function} successFn callback fn to call after checking sync status of file
     * @param {function} failFn error fn to call if error occurs
     */
    "syncFile": (file, successFn, failFn) => {
      if (file.sync.type !== ORG.Store.SyncType.DBOX) return failFn(NotLinkedError);
      const dbox = DropboxFns.getDropbox();
      if (!dbox) return failFn(NotLinkedError);
      return dbox.filesGetMetadata({"path": file.sync.path}).then((fileMetaData) => {
        const modifiedDate = new Date(fileMetaData.server_modified).getTime();

        const fetchSuccessFn = (text, metadata) => {
          file.dml = new Date(metadata.server_modified).getTime();
          file.sync.stat = SyncStatus.SYNC;
          ORG.Store.updateFile(file, ORG.Parser.parseFile(file.name, text, ORG.Settings.getSettingsObj()));
          successFn(SyncStatus.SYNC);
        };

        if (modifiedDate > file.dml) { // dbox file is changed
          if (file.sync.stat) { // also client file is changed or conflicted
            successFn(SyncStatus.CONFLICT);
          } else { // update local file
            DropboxFns.fetchFile(file.sync.path, fetchSuccessFn, failFn);
          }
        } else if (file.sync.stat === SyncStatus.MODIFIED) { // client file is changed
          DropboxFns.uploadFile(
            file.sync.path,
            ORG.Store.getFileContents(file.id),
            (metadata) => {
              file.dml = new Date(metadata.server_modified).getTime();
              file.sync.stat = SyncStatus.SYNC;
              ORG.Store.updateFile(file);
              successFn(SyncStatus.SYNC);
            },
            failFn
          );
        } else {
          DropboxFns.fetchFile(file.sync.path, fetchSuccessFn, failFn);
        }
      }).catch(() => failFn(UnknownPathError + " \"" + file.name + "\""));
    },
    "unlink": () => store.deleteToken(store.Tokens.Dropbox)
  };

  ORG.Sync = {
    "fetchDropboxFile": DropboxFns.fetchFile,
    "getDropboxFileList": DropboxFns.getFileList,
    "unlinkDropbox": DropboxFns.unlink,
    "syncFile": (file, successFn, failFn) => {
      switch (file.sync.type) {
      case ORG.Store.SyncType.DBOX:
        return DropboxFns.syncFile(file, successFn, failFn);
      default: throw "Unknown Server";
      }
    }
  };
})();
