/* eslint-disable max-len */
/* eslint-disable import/no-dynamic-require */
// Partially from https://github.com/facebook/create-react-app/blob/f0a837c1f07ebd963ddbba2c2937d04fc1b79d40/packages/react-scripts/config/paths.js
const path = require('path');
const fs = require('fs');
const getPublicUrlOrPath = require('react-dev-utils/getPublicUrlOrPath');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebook/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
// webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
const publicUrlOrPath = getPublicUrlOrPath(
  process.env.NODE_ENV === 'development',
  require(resolveApp('package.json')).homepage,
  process.env.PUBLIC_URL
);

module.exports = {
  appPath: resolveApp('apps/custom-config'),
  indexTemplate: resolveApp('apps/custom-config/src/hbs/index.hbs'),
  iframeTemplate: resolveApp('apps/custom-config/src/hbs/iframe.hbs'),
  publicUrlOrPath,
  theme: (themeId) => resolveApp(`libs/shared/themes/src/${themeId}`),
};