var co = require('co');
var _ = require('lodash');
var pathToRegexp = require('path-to-regexp');

function KoaAuthority(options) {
  var routes = _.isArray(options.routes) ? options.routes : [];
  var authorities = _.isArray(options.authorities) ? options.authorities : [];
  var middleware = _.isFunction(options.middleware) ? options.middleware : () => Promise.resolve();
  var message = options.message || '权限校验失败';
  var models = [];

  (function mixins(input) {
    if (_.isArray(input)) return _.forEach(input, each => { mixins(each); });
    if (_.has(input, 'stack')) {
      _.has(input, 'path')
      ? models.push({[input.path]: input.methods || []})
      : mixins(input.stack);
    }
  })(routes);

  return co.wrap(function *(ctx, next) {
    ctx.authorityModels = models;
    ctx.authorities = authorities;

    try {
      yield middleware(ctx);

      var check = false;
      _.forEach(ctx.authorities, (model, index) => {
        _.mapKeys(model, (value, key) => {
          const regexp = pathToRegexp(key, []);
          if (regexp.test(ctx.request.url)) return check = true;
        });
      });
      check ? yield next() : ctx.app.emit('error', message, ctx);
    } catch (e) {
      ctx.app.emit('error', e.message, ctx);
    }
  });
};

module.exports = KoaAuthority;