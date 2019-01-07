# OrgModeWeb

[OrgModeWeb](https://orgmodeweb.org) is a web app to view, edit and search org files.

The idea is to build an app for org-mode sufficiently usable without emacs, giving the same searching and viewing experience.

## How It Works

OrgModeWeb works 100% on web browser, no server side coding, caching, database etc.

It Uses service-workers to work offline. It is mobile friendly and can be used as a mobile app (PWA) by adding on Home Screen.

OrgModeWeb creates and stores files on LocalStorage of the browser and uses a newly developed fast javascript parser: OrgParser.

Then it searches on the parsed result using the OrgSearcher which produces same results as in emacs org-mode.

The editing idea is inspired from [Jupyter Notebooks](https://jupyter.org/), where you move on headings with a cursor. When you want to edit, press enter and change to edit mode. Ctrl+enter to finish editing.

## Currently Supported

- **Agenda View :** View agenda similarly in org-mode
- **Match Search :** Match TAG|TODO|PROPERTY as described in [org-mode](https://orgmode.org/manual/Matching-tags-and-properties.html) (no regexp or backward compatibility), some examples:

      +tag1-tag2 : show items tagged with "tag1" but not having "tag2"

      TODO=NEXT|tag3 : show items with NEXT todo state or items tagged with "tag3"
  
      SCHEDULED="<today>" : show items scheduled for today

      DEADLINE+PRIORITY=A : show items having a deadline and priority A

      STYLE=habit : list habits

- **Keyword Search**
- **Custom TODO keywords :** You can set custom TODO keywords and styles in settings. Change "todo-keywords" in settings menu, keywords are seperated by space and a "|" symbol seperates the done states as in org-mode (such as: "TODO NEXT | DONE"). You can give styles to each keyword by changing "todo-faces" in settings.
- **Habits :** Properly view habits on agenda (no graph)
- **Dropbox Sync :** Syncronize org files in your Dropbox. Keeps your account key on LocalStorage, there is no server side!

  - if file name:

    ![g](https://placehold.it/15/00ff00/000000?text=+) : there are no local changes (lastly synced with server)

    ![w](https://placehold.it/15/ffffff/000000?text=+) : there are local changes not synchronized

    ![r](https://placehold.it/15/ff0000/000000?text=+) : conflict, both local and server files are changed

    ![y](https://placehold.it/15/ffff00/000000?text=+) : currently synchronizing the file

- **Category Filter :** You can filter by category on Agenda and Search views by clicking on category name.
- **Text Formatting :** \*bold* /italic/ \_underline_ [[links][...]] are supported
- **Inactive Timestamps :** Items with inactive timestamps can be shown in agenda
- **Agenda Sorting :** Search results can be sorted by time, habit, category, priority, todo and alpha (thanks to [thenBy.js](https://github.com/Teun/thenBy.js))
- **Keyboard Shortcuts :** Similar to emacs org-mode and org-speed-commands (thanks to [jQuery Hotkeys](https://github.com/tzuryby/jquery.hotkeys))
  - **n, p, f, b, u, down, up :** move cursor on headings
  - **t :** set TODO state of the heading
  - **o :** open link (if any) in the heading
  - **tab, shift+tab :** cycle visibility of heading(s) on file view, go to heading on Agenda and Search views
  - **M-left, M-right, M-S-left, M-S-right:** decrease/increase level of heading
  - **M-up, M-down, M-S-up, M-S-down:** move heading tree up/down
  - **M-<, M-> :** go-to beginning and end of file
  - **C-enter :** create new file/heading/setting
  - **enter :** goto file in file menu, change to edit mode when in file
  - **C-l :** center the heading on screen
  - **< :** category filter on Agenda and Search views
  - **M-x :** goto file menu
  - **M-s :** goto settings (on file menu)
- **Custom Agenda Views :** You can build custom agendas similarly in org mode

  As an example to build a 3-day agenda with projects listing (with *prj* tag) and a keyword search section:
  1. Create a new setting in settings
  2. Set setting name: custom-agenda-b (last letter will be the shortcut key)
  3. Set value as below

      ```bash
        --type agenda --agenda-span 3 --header "My Agenda"
        --type tags --filter +prj-DONE --header "My Projects"
        --type search --text "keyword"
      ```

  4. Here each line corresponds to a search section in the custom agenda. There are 3 types of sections: *agenda*, *tags*, *search*. Parameters can be:

      **--agenda-span :** sets how many days the agenda will show starting from today

      **--filter :** sets filter on results as TAG|TODO|PROP match string similarly in [org-mode](https://orgmode.org/manual/Matching-tags-and-properties.html)

      **--header :** the text will be shown on the menu or section header

      **--text :** sets the search keyword only for search type

## Limitations

- LocalStorage limit of browsers are generally 5MB (some are 10MB). Because org files are stored on LocalStorage, it seems to limit the size, but haven't tested with org files greater than 5MB.

- When saving the org file, OrgModeWeb tries to keep the file as similar as possible to the original, however minor differences may occur such as number of empty lines, but the information will be same.

- Tested and works on latest versions of modern browsers (Chrome, Firefox, Opera, Edge) and Android versions. Haven't tested older versions. Haven't tested on Safari but since it supports service-workers, should work fine.

## Next

Some features I am planning to implement:

- An action toolbar for fast setting of todo, priority, tag, schedule and deadline of headings
- Move forward and backward days on agenda view
- Capturing notes
- Logging of state changes as in org-mode
- Clocking as in org-mode

## Installation

- to install dependencies

  ```bash
    npm i
  ```

- to start server

  ```bash
    gulp serve
  ```

- to start unit tests

  ```bash
    gulp test
  ```

- to create dist package (on /dist folder)

  ```bash
    gulp
  ```