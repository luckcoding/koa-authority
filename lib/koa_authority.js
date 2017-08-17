var co = require('co');
var _ = require('lodash');
var pathToRegexp = require('path-to-regexp');

function KoaAuthority(options) {
  var middleware = _.isFunction(options.middleware) ? options.middleware : function () {
    return Promise.resolve([]);
  }
  var message = options.message || 'Koa Authority: Authentication Error';

  var Router = new RouterLayer(options.routes);

  var amass = Router.amass();
  var scatter = Router.scatter();

  return co.wrap(function *(ctx, next) {

    var url = ctx.request.url.split('?')[0];
    var method = ctx.request.method;

    var authorities = yield middleware(ctx, {
      amass: amass,
      scatter: scatter,
    });

    _.forEach(amass, function (item, key) {
      if (pathToRegexp(key).exec(url) && _.includes(item, method)) {
        if (!_.isArray(authorities)) return ctx.throw(401, 'Koa Authority: middleware return must be Array !');
        if (!scatter2amass(authorities)[key]) return ctx.throw(401, message);
      }
    })

    yield next();
  });
}

function RouterLayer(router) {
  this.router = router;
};

RouterLayer.prototype.scatter = function() {
  var map = [];
  (function deep(input) {
    if (_.isArray(input)) return _.forEach(input, function (each) {
      deep(each);
    });
    if (_.has(input, 'stack')) {
      _.has(input, 'path')
      ? map.push({[input.path]: input.methods || []})
      : deep(input.stack);
    }
  })(this.router);
  return map;
};

RouterLayer.prototype.amass = function() {
  var obj = {};
  (function deep(input) {
    if (_.isArray(input)) return _.forEach(input, function (each) {
      deep(each);
    });
    if (_.has(input, 'stack')) {
      _.has(input, 'path')
      ? obj[input.path] = _.concat(obj[input.path] || [], input.methods)
      : deep(input.stack);
    }
  })(this.router);
  return obj;
};

function scatter2amass(scatter) {
  var amass = {}
  _.forEach(scatter, function (item) {
    for (var key in item) {
      amass[key] = _.concat(amass[key] || [], item[key]);
    }
  })
  return amass;
};

module.exports = KoaAuthority;