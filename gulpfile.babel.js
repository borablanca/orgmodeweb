"use strict";

import path from "path";
import gulp from "gulp";
import del from "del";
import runSequence from "run-sequence";
import browserSync from "browser-sync";
import swPrecache from "sw-precache";
import gulpLoadPlugins from "gulp-load-plugins";
import { output as pagespeed } from "psi";
import pkg from "./package.json";

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task("lint", () =>
  gulp.src(["app/js/**/*.js", "!node_modules/**"])
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
  ], {
      dot: true
    }).pipe(gulp.dest("dist"))
    .pipe($.size({ title: "copy" }))
);

gulp.task("styles", () => {
  const AUTOPREFIXER_BROWSERS = [
    "ie >= 11",
    "ie_mob >= 10",
    "ff >= 30",
    "chrome >= 34",
    "safari >= 7",
    "opera >= 23",
    "ios >= 7",
    "android >= 4.4",
    "bb >= 10"
  ];

  return gulp.src([
    "app/css/*.sass",
    "app/css/*.css"
  ])
    .pipe($.newer(".tmp/css"))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10
    }).on("error", $.sass.logError))
    .pipe($.autoprefixer({ browsers: ['last 5 versions'] }))
    .pipe(gulp.dest(".tmp/css"))
    // Concatenate and minify styles
    .pipe($.if("*.css", $.cssnano()))
    .pipe($.size({ title: "styles" }))
    .pipe($.sourcemaps.write("./"))
    .pipe(gulp.dest("dist/css"))
    .pipe(gulp.dest(".tmp/css"));
});

// Concatenate and minify JavaScript. Optionally transpiles ES2015 code to ES5.
// to enable ES2015 support remove the line `"only": "gulpfile.babel.js",` in the
// `.babelrc` file.
gulp.task("scripts", () =>
  gulp.src([
    "./app/js/lib/jquery.hotkeys.js",
    "./app/js/lib/thenBy.js",
    "./app/js/utils.js",
    "./app/js/main.js",
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
    "./app/js/ui/OrgContext.js",
    "./app/js/ui/OrgNotify.js",
    "./app/js/ui/OrgFiles.js",
    "./app/js/ui/OrgSettings.js",
    "./app/js/ui/OrgDropbox.js",
    "./app/js/ui/OrgSearch.js",
    "./app/js/data/OrgDropbox.js",
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
    // Output files
    .pipe($.size({ title: "scripts" }))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest("dist/js"))
    .pipe(gulp.dest(".tmp/js"))
);

// Scan your HTML for assets & optimize them
gulp.task("html", () => {
  return gulp.src("app/**/*.html")
    .pipe($.useref({
      searchPath: "{.tmp,app}",
      noAssets: true
    }))

    // Minify any HTML
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
    // Output files
    .pipe($.if("*.html", $.size({ title: "html", showFiles: true })))
    .pipe(gulp.dest("dist"));
});

gulp.task("clean", () => del([".tmp", "dist/*", "!dist/.git"], { dot: true }));

gulp.task("serve", ["scripts", "styles"], () => {
  browserSync({
    notify: false,
    logPrefix: "ORG",
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ["main"],
    // https: true,
    server: [".tmp", "app"],
    port: 3000
  });

  gulp.watch(["app/**/*.html"], reload);
  gulp.watch(["app/css/**/*.{sass,css}"], ["styles", reload]);
  gulp.watch(["app/js/**/*.js"], ["lint", "scripts", reload]);
  gulp.watch(["app/img/**/*"], reload);
});

gulp.task("serve:dist", ["default"], () =>
  browserSync({
    notify: false,
    logPrefix: "ORG",
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ["main"],
    // https: true,
    server: "dist",
    port: 3001
  })
);

// Build production files, the default task
gulp.task("default", ["clean"], cb =>
  runSequence(
    "styles",
    ["lint", "html", "scripts", "images", "copy"],
    "generate-service-worker",
    cb
  )
);

gulp.task("test", () => {
  gulp.src([
    "./node_modules/jquery/dist/jquery.min.js",
    "./node_modules/qunit/qunit/qunit.css",
    "./node_modules/qunit/qunit/qunit.js",
    "./node_modules/qunit-assert-close/qunit-assert-close.js",
    "./node_modules/qunit-assert-compare/qunit-assert-compare.js",
    "./node_modules/qunit-dom/dist/qunit-dom.js"
  ], {
      dot: true
    }).pipe($.newer("test/lib"))
    .pipe(gulp.dest("test/lib"))
    .pipe($.size({ title: "copy" }))
  browserSync({
    files: ["test/*.test.js", "app/js/**/*.js"],
    notify: true,
    logPrefix: "ORG_TEST",
    server: ".",
    single: true,
    startPath: "test/qunit.html",
    port: 3003
  })
});

// Run PageSpeed Insights
gulp.task("pagespeed", cb =>
  // Update the below URL to the public URL of your site
  pagespeed("https://org.firebaseapp.com", {
    strategy: "mobile"
    // By default we use the PageSpeed Insights free (no API key) tier.
    // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
    // key: 'YOUR_API_KEY'
  }, cb)
);

// Copy over the scripts that are used in importScripts as part of the generate-service-worker task.
gulp.task("copy-sw-scripts", () => {
  return gulp.src(["node_modules/sw-toolbox/sw-toolbox.js", "app/js/sw/runtime-caching.js"])
    .pipe(gulp.dest("dist/js/sw"));
});

// See http://www.html5rocks.com/en/tutorials/service-worker/introduction/ for
// an in-depth explanation of what service workers are and why you should care.
// Generate a service worker file that will provide offline functionality for
// local resources. This should only be done for the 'dist' directory, to allow
// live reload to work as expected when serving from the 'app' directory.
gulp.task("generate-service-worker", ["copy-sw-scripts"], () => {
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
      // Add/remove glob patterns to match your directory setup.
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

// Load custom tasks from the `tasks` directory
// Run: `npm install --save-dev require-dir` from the command-line
// try { require('require-dir')('tasks'); } catch (err) { console.error(err); }
