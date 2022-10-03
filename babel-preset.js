/**
 * Loose mode is controlled by a flag in '@nrwl/web/babel'
 * https://github.com/rmarganti/nx/blob/cddb1edd5670e6ac7b106acc427dc23117cc2740/packages/web/babel.ts#L56
 * In the repository we use by default '@nrwl/react/babel' which forwards to '@nrwl/web/babel'
 * only 'useBuiltIns' flag
 * https://github.com/nrwl/nx/blob/b50d7e4b0c3d04df5398cad19b2a7c8c46c65940/packages/react/babel.ts#L20
 * This is a small wrapper over '@nrwl/react/babel' which forwards classProperties to '@nrwl/web/babel'.
 * Probably a PR to NX repo would be also good to avoid this wrapper by extending props which
 * are forwarded from '@nrwl/react/babel' to '@nrwl/web/babel'.
 */

module.exports = function (config, { classProperties, ...options }) {
  const babelConfig = require("@nrwl/react/babel")(config, options)

  const nrwlWebPreset = babelConfig.presets.find((preset) => preset[0] === '@nrwl/web/babel');

  if (typeof classProperties?.loose === 'boolean') {
    nrwlWebPreset[1].classProperties = classProperties;
  }

  return babelConfig
};
