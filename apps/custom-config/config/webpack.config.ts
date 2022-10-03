/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-regex-literals */
import path from 'path';
import type { Configuration } from 'webpack';
import webpack from 'webpack';

import nrwlConfig from '@nrwl/react/plugins/webpack';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import WorkboxWebpackPlugin from 'workbox-webpack-plugin';
import ModuleNotFoundPlugin from 'react-dev-utils/ModuleNotFoundPlugin';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';

import paths from './paths';

// https://github.com/nrwl/nx/issues/6941#issuecomment-914058927
export const removeIndexHtmlWebpackPlugin = (config: Configuration) => {
  if (!config.plugins) return;

  const idx = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'IndexHtmlWebpackPlugin'
  );
  config.plugins.splice(idx, 1);
};

export const removeRule = (config: Configuration, extension: string) => {
  if (!config.module?.rules) return;

  const idx = config.module.rules.findIndex((rule) => {
    if (typeof rule !== 'object') return false;
    if (!(rule.test instanceof RegExp)) return false;

    return rule.test.test(extension);
  });

  config.module.rules.splice(idx, 1);
};

type HtmlWebpackConfig = [
  filename: string,
  chunk: string,
  template: string,
  options: Record<string, unknown>
][];

const DEFAULT_HOSTNAME = 'foo';

// Instead of doing NODE_ENV=development nx dev web each time developing locally
// default NODE_ENV to develop when nothing is set.
// When building for production it set automatically to production.
process.env.NODE_ENV = process.env.NODE_ENV
  ? process.env.NODE_ENV
  : 'development';

const webpackEnv = process.env.NODE_ENV;

const IMAGE_INLINE_SIZE_LIMIT = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000',
  10
);

export default (config, context) => {
  // @ts-expect-error types are missing for default export
  // types exist only for getWebpackConfig but function export is broken
  nrwlConfig(config);

  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires
  const {
    theme = 'foo',
    themeId = 'baz',
    title = 'baz',
    manifestOptions = {} as any,
    faviconPublicPath = '',
  } = {};

  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  // `publicUrl` is just like `publicPath`, but we will provide it to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  const publicUrl = paths.publicUrlOrPath.slice(0, -1);

  // IndexHtmlWebpackPlugin != HtmlWebpackPlugin. That's homemade nx plugin which doesn't support handlebars loader
  removeIndexHtmlWebpackPlugin(config);
  // Remove rules provided by NX as they are using deprecated url and file loaders.
  removeRule(config, '.png');
  removeRule(config, '.svg');

  config.output.publicPath = paths.publicUrlOrPath;
  if (config.output.filename.startsWith('[name]')) {
    config.output.filename = `static/js/${config.output.filename}`;
  }

  // Output for assets. When bundled asset logo.png will be in /static/media/logo.png
  config.output.assetModuleFilename = 'static/media/[hash][ext][query]';

  config.entry = {
    ...config.entry,
  };
  return {
    ...config,
    module: {
      rules: [
        ...config.module.rules,
        {
          test: /\.(bmp|gif|jpe?g|png|mp4|gif|webp|avif)/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: IMAGE_INLINE_SIZE_LIMIT,
            },
          },
        },
        {
          test: /\.svg$/i,
          type: 'asset',
          resourceQuery: /url/, // *.svg?url
          parser: {
            dataUrlCondition: {
              maxSize: IMAGE_INLINE_SIZE_LIMIT,
            },
          },
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                ref: true,
                svgoConfig: {
                  plugins: [
                    { name: 'prefixIds', params: { prefixClassNames: false } },
                  ],
                },
              },
            },
          ],
          resourceQuery: { not: [/url/] },
        },
        {
          test: /\.hbs$/,
          loader: 'handlebars-loader',
        },
      ],
    },
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        theme: paths.theme(themeId),
        // https://github.com/handlebars-lang/handlebars.js/issues/1174#issuecomment-885595535
        handlebars: 'handlebars/dist/handlebars.min.js',
      },
      fallback: {
        ...config.resolve.fallback,
        events: require.resolve('events/'),
        module: false,
        dgram: false,
        // dns: 'mock',
        fs: false,
        http2: false,
        net: false,
        tls: false,
        child_process: false,
      },
    },
    plugins: [
      ...config.plugins,
      new webpack.DefinePlugin({
        // Backwards compatibility with pre monorepo configuration. Required for service worker to work properly
        'process.env.PUBLIC_URL': JSON.stringify(publicUrl),
        'process.env.FAVICON_PUBLIC_PATH': JSON.stringify(faviconPublicPath),
      }),
      ...(
        [['index.html', 'main', paths.indexTemplate, {}]] as HtmlWebpackConfig
      ).map(
        ([filename, chunk, template, options]) =>
          new HtmlWebpackPlugin({
            inject: true,
            template,
            title,
            filename,
            chunks: [chunk, 'polyfills'],
            apiBaseUrl: isEnvProduction ? '#{api.app.baseUrl}#' : '/api',
            doPreConnect: isEnvProduction,
            doAnalytics: isEnvProduction,
            faviconPublicPath,
            theme,
            ...(isEnvProduction
              ? {
                  minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true,
                  },
                }
              : undefined),
            ...options,
          })
      ),
      new ModuleNotFoundPlugin(paths.appPath),
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = [...entrypoints.main].filter(
            (fileName) => !fileName.endsWith('.map')
          );

          /**
           * // Bad typing for a return value in generate.
           * Docs says `can return anything as long as it's serialisable by JSON.stringify`
           * But types are (...) => Manifest where Manifest is Record<string, string>
           */
          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          } as any;
        },
      }),
      new WebpackPwaManifest({
        name: title,
        short_name: title,
        description: '',
        start_url: '/',
        theme_color: manifestOptions.themeColor,
        background_color: manifestOptions.backgroundColor,
        orientation: 'portrait',
        // https://github.com/arthurbergmz/webpack-pwa-manifest/issues/149#issuecomment-786336572
        publicPath: paths.publicUrlOrPath,
        crossorigin: 'use-credentials',
        icons: [],
        display: 'standalone',
        inject: true,
        ios: {
          'apple-mobile-web-app-title': title,
        },
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the Webpack build.
      // TODO: Check on production
      isEnvProduction &&
        new WorkboxWebpackPlugin.GenerateSW({
          clientsClaim: true,
          // the reason we put this service worker in place is to have the 'add to home screen' feature enabled
          // this feature is available when the fetch event is used.
          // Unfortunately with webpack 5 only workbox-webpack-plugin v6 is working and they have changed
          // the behavior and now it's impossible to avoid precaching files. If no file for precaching is matched
          // it errors that at least one file should be matched or enable runtime caching.
          // To bypass that restriction exclude all files from precaching and enable runtime caching
          // with network only strategy and pattern which is (hopefully) not possible to match
          swDest: 'serviceWorker.js',
          exclude: [/.*/],
          runtimeCaching: [
            { handler: 'NetworkOnly', urlPattern: /impossible-pattern/ },
          ],
          navigateFallbackDenylist: [
            // Exclude URLs starting with /_, as they're likely an API call
            new RegExp('^/_'),
            // Exclude any URLs whose last part seems to be a file extension
            // as they're likely a resource and not a SPA route.
            // URLs containing a "?" character won't be blacklisted as they're likely
            // a route with query params (e.g. auth callbacks).
            new RegExp('/[^/?]+\\.[^/]+$'),
          ],
        }),
      // FIXME: not working at the moment. Probably this PR could fix it https://github.com/nrwl/nx/pull/7542
      // process.env.BUNDLE_ANALYZE_ENABLED === 'true' && new BundleAnalyzerPlugin()
    ].filter(Boolean),
    node: {
      global: true,
    },
  };
};
