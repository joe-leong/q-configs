/**
 * essential 级别出口文件仅将会为必要的规则保留 error 级别
 */

module.exports = {
  extends: [
    '../index',
    './rules/set-style-to-warn',
    './rules/blacklist',
    './rules/es6-blacklist',
  ].map(require.resolve),
};
