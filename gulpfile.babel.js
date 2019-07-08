const browserSync = require("browser-sync");
const del = require("del");
const gulp = require("gulp");
const path = require("path");
const pkg = require("./package.json");
const psi = require("psi");
const swPrecache = require("sw-precache");
const $ = require("gulp-load-plugins")();

gulp.task("lint", () =>
  gulp.src(["app/js/**/*.js"])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()))
);

gulp.task("images", () =>
  gulp.src("app/img/**/*")
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest("dist/img"))
    .pipe($.size({ title: "images" }))
);

// Copy all files at the root level (app)
gulp.task("copy", () =>
  gulp.src([
    "app/*",
    "!app/*.html",
    "node_modules/apache-server-configs/dist/.htaccess"
  ], { dot: true })
    .pipe(gulp.dest("dist"))
    .pipe($.size({ title: "copy" }))
);

gulp.task("styles", () =>
  gulp.src([
    "node_modules/normalize.css/normalize.css",
    "app/css/*.css"
  ])
    .pipe($.concat("main.css"))
    .pipe($.autoprefixer({ Browserslist: ['last 5 versions'] }))
    .pipe(gulp.dest(".tmp/css"))
    .pipe($.if("*.css", $.cssnano()))
    .pipe($.size({ title: "styles" }))
    .pipe(gulp.dest("dist/css"))
    .pipe(gulp.dest(".tmp/css")));

// Concatenate and minify JavaScript. Optionally transpiles ES2015 code to ES5.
// to enable ES2015 support remove the line `"only": "gulpfile.babel.js",` in the
// `.babelrc` file.
gulp.task("scripts", () => gulp.src(
  [
    "./app/js/lib/jquery.hotkeys.js",
    "./app/js/main.js",
    "./app/js/utils.js",
    "./app/js/ui/OrgCalendar.js",
    "./app/js/data/OrgDefaults.js",
    "./app/js/data/OrgParser.js",
    "./app/js/data/OrgSearcher.js",
    "./app/js/data/OrgWriter.js",
    "./app/js/data/OrgData.js",
    "./app/js/data/OrgSorter.js",
    "./app/js/data/OrgStore.js",
    "./app/js/data/OrgSettings.js",
    "./app/js/ui/OrgIcons.js",
    "./app/js/ui/OrgKeyboard.js",
    "./app/js/ui/OrgMenu.js",
    "./app/js/ui/OrgNavbar.js",
    "./app/js/ui/OrgActionBar.js",
    "./app/js/ui/OrgContext.js",
    "./app/js/ui/OrgNotify.js",
    "./app/js/ui/OrgFiles.js",
    "./app/js/ui/OrgSettings.js",
    "./app/js/ui/OrgDropbox.js",
    "./app/js/ui/OrgSearch.js",
    "./app/js/data/OrgSync.js",
    "./app/js/ui/OrgNotes.js",
    "./app/js/data/OrgRouter.js",
  ])
  .pipe($.newer(".tmp/js"))
  .pipe($.sourcemaps.init())
  .pipe($.babel())
  .pipe($.sourcemaps.write())
  .pipe(gulp.dest(".tmp/js"))
  .pipe($.concat("main.min.js"))
  .pipe($.uglify())
  .pipe($.size({ title: "scripts" }))
  .pipe($.sourcemaps.write("."))
  .pipe(gulp.dest("dist/js"))
  .pipe(gulp.dest(".tmp/js"))
);

// Scan your HTML for assets & optimize them
gulp.task("html", () => gulp.src("app/**/*.html")
  .pipe($.useref({
    searchPath: "{.tmp,app}",
    noAssets: true
  }))
  .pipe($.if("*.html", $.htmlmin({
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeOptionalTags: true
  })))
  .pipe($.if("*.html", $.size({ title: "html", showFiles: true })))
  .pipe(gulp.dest("dist"))
);

gulp.task("clean", () => del([".tmp", "dist/*", "!dist/.git"], { dot: true }));

// Copy over the scripts that are used in importScripts as part of the generate-service-worker task.
gulp.task("copy-sw-scripts", () => gulp.src(
  [
    "node_modules/sw-toolbox/sw-toolbox.js",
    "app/js/sw/runtime-caching.js"
  ])
  .pipe(gulp.dest("dist/js/sw"))
);

// See http://www.html5rocks.com/en/tutorials/service-worker/introduction/ for an in-depth explanation service workers
gulp.task("generate-service-worker", gulp.series("copy-sw-scripts"), () => {
  const rootDir = "dist";
  const filepath = path.join(rootDir, "service-worker.js");

  return swPrecache.write(filepath, {
    // Used to avoid cache conflicts when serving on localhost.
    cacheId: pkg.name || "orgmodeweb",
    // sw-toolbox.js needs to be listed first. It sets up methods used in runtime-caching.js.
    importScripts: [
      "js/sw/sw-toolbox.js",
      "js/sw/runtime-caching.js"
    ],
    staticFileGlobs: [
      `${rootDir}/img/**/*`,
      `${rootDir}/js/**/*.js`,
      `${rootDir}/css/**/*.css`,
      `${rootDir}/*.{html,json}`
    ],
    // Translates a static file path to the relative URL that it's served from.
    // This is '/' rather than path.sep because the paths returned from
    // glob always use '/'.
    stripPrefix: rootDir + "/"
  });
});

// Build production files, the default task
gulp.task("default", gulp.series(
  "clean",
  "styles",
  "html",
  "lint",
  "scripts",
  "images",
  "copy",
  "generate-service-worker"
), cb => cb());

gulp.task("serve:dist", gulp.series("default"), () =>
  browserSync.create().init({
    notify: false,
    logPrefix: "ORG",
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ["main"],
    // https: true,
    server: "dist",
    port: 3001
  })
);

gulp.task("reload", (done) => {
  browserSync.reload();
  done();
});

gulp.task("serve", gulp.series("scripts", "styles", (done) => {
  browserSync.init({
    notify: false,
    logPrefix: "ORG",
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ["main"],
    // https: true,
    server: [".tmp", "app"],
    port: 3000
  });
  gulp.watch("app/**/*.html", gulp.series("reload"));
  gulp.watch("app/css/**/*.css", gulp.series("styles", "reload"));
  gulp.watch("app/js/**/*.js", gulp.series("scripts", "reload"));
  gulp.watch("app/img/**/*", gulp.series("reload"));
  done();
}));

gulp.task("test", (done) => {
  browserSync.create().init({
    files: ["test/**/*.test.js", "app/js/**/*.js", "test/qunit.html"],
    notify: true,
    logPrefix: "ORG_TEST",
    server: ".",
    single: true,
    startPath: "test/qunit.html?hidepassed&noglobals&seed",
    port: 3003,
    ui: {
      "port": 3004
    },
  });
  done();
});

gulp.task("dev", gulp.parallel("serve", "test"))

// Run PageSpeed Insights
gulp.task("pagespeed", (done) => {
  psi('orgmodeweb.org').then(data => {
    console.log('Speed score:', data.ruleGroups.SPEED.score);
    console.log('Usability score:', data.ruleGroups.USABILITY.score);
    console.log(data.pageStats);
  });
  done();
});