var co = require('co');
var _ = require('lodash');
var pathToRegexp = require('path-to-regexp');

function KoaAuthority(options) {
  var filter = options.filter || [];
  var middleware = _.isFunction(options.middleware) ? options.middleware : function () {
    return Promise.resolve();
  };
  var message = options.message || 'Koa Authority: Authentication Error';
  var models = mixins(options.routes);
  var filter = mixins(options.filter);

  return co.wrap(function *(ctx, next) {
    ctx.authorityModels = models;
    ctx.authorities = [];

    try {
      yield middleware(ctx);

      var check = false;
      _.forEach(_.concat(ctx.authorities, filter), function (model, index) {
        _.mapKeys(model, function (value, key) {
          var url = ctx.request.url.split('?')[0];
          if (pathToRegexp(key).exec(url)
            && _.includes(value, ctx.request.method)) return check = true;
        });
      });

      if (!check) throw new Error(message);
    } catch (e) {
      ctx.throw(401, e.message);
    }

    yield next();
  });
};

function mixins(input) {
  var output = [];
  (function mixins(input) {
    if (_.isArray(input)) return _.forEach(input, function (each) {
      mixins(each);
    });
    if (_.has(input, 'stack')) {
      _.has(input, 'path')
      ? output.push({[input.path]: input.methods || []})
      : mixins(input.stack);
    }
  })(input);
  return output;
};

module.exports = KoaAuthority;