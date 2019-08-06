(() => {
  /*
   * Check to make sure service workers are supported in the current browser,
   * and that the current page is accessed from a secure origin. Using a
   * service worker from an insecure origin will trigger JS console errors. See
   * http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
   */
  const isLocalhost = Boolean(window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" || // [::1] is the IPv6 localhost address.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/) // 127.0.0.1/8 is considered localhost for IPv4.
  );

  // orgmodeweb works on localstorage!
  if (!localStorage) {
    return $("body").html("<div class='orgnotice'>Your browser does not support Org</div>");
  }
  if (!navigator.serviceWorker && (window.location.protocol === "https:" || isLocalhost)) {
    navigator.serviceWorker.register("service-worker.js")
      .then((registration) => {
        // updatefound is fired if service-worker.js changes.
        registration.onupdatefound = () => {
          const updateNotifyFn = () => $("body").orgNotify({
            "content": "There is a new version! Click to install",
            "confirm": () => window.location.reload(),
          });

          /*
           * updatefound is also fired the very first time the SW is installed,
           * and there's no need to prompt for a reload at that point.
           * So check here to see if the page is already controlled,
           * i.e. whether there's an existing service worker.
           */
          if (navigator.serviceWorker.controller) {
            /*
             * The updatefound event implies that registration.installing is set:
             * https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
             */
            const installingWorker = registration.installing;

            installingWorker.onstatechange = () => {
              switch (installingWorker.state) {
              case "installed": /*
                * At this point, the old content will have been purged and the
                * fresh content will have been added to the cache.
                * It's the perfect time to display a "New content is
                * available; please refresh." message in the page's interface.
                */
                updateNotifyFn();
                break;
              case "redundant": throw new Error("The installing service worker became redundant.");
              default:// Ignore
              }
            };
            if (registration.waiting) {
              updateNotifyFn();
            }
          }
        };
      }).catch(() => $("body").orgNotify("Error during service worker registration"));
  }
  return window.ORG = {
    "route": null,
    "defaults": null,
    "Icons": null,
    "Parser": null,
    "Searcher": null,
    "Writer": null,
    "Sorter": null,
    "Utils": null,
    "Calendar": null,
    "Store": null,
    "Sync": null,
    "Settings": null
  };
})();
