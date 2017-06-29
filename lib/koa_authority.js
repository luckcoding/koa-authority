var co = require('co');
var _ = require('lodash');
var pathToRegexp = require('path-to-regexp');

function KoaAuthority(options) {
  var routes = _.isArray(options.routes) ? options.routes : [];
  var filter = _.isArray(options.filter) ? options.filter : [];
  var middleware = _.isFunction(options.middleware) ? options.middleware : function () {
    return Promise.resolve();
  };
  var message = options.message || '权限校验失败';
  var models = [];

  (function mixins(input) {
    if (_.isArray(input)) return _.forEach(input, function (each) {
      mixins(each);
    });
    if (_.has(input, 'stack')) {
      _.has(input, 'path')
      ? models.push({[input.path]: input.methods || []})
      : mixins(input.stack);
    }
  })(routes);

  return co.wrap(function *(ctx, next) {
    ctx.authorityModels = models;
    ctx.authorities = [];

    try {
      yield middleware(ctx);

      var check = false;
      _.forEach(_.concat(ctx.authorities, filter), function (model, index) {
        _.mapKeys(model, function (value, key) {
          if (pathToRegexp(key).exec(ctx.request.url)
            && _.includes(value, ctx.request.method)) return check = true;
        });
      });
      check ? yield next() : ctx.app.emit('error', message, ctx);
    } catch (e) {
      ctx.app.emit('error', e.message, ctx);
    }
  });
};

module.exports = KoaAuthority;