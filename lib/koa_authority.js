var co = require('co');
var lodash = require('lodash');
var pathToRegexp = require('path-to-regexp');

var checkTypeErrorMsg = 'routes must like [{ path: \'x\', methods: [\'POST\'] }]';
var verificationFailureMsg = 'Koa Authority: Authentication Error';

function KoaAuthority(options) {
  /**
   * middle
   * @return {Promise}
   */
  var middleware = options.middleware || function () {
    return Promise.resolve(true);
  }

  /**
   * 401 message
   */
  var message = options.message || verificationFailureMsg;

  /**
   * options.routes is a kou-router Object ?
   * @type {Boolean}
   */
  var useKoaRouter = options.useKoaRouter

  /**
   * routes need check
   * @type {Array}
   * [
   *   {
   *     path: 'api/user',
   *     method: ['POST'],
   *     name: 'create one user'
   *   },
   *   ...
   * ]
   */
  var routes = useKoaRouter
    ? parseKoaRouter(options.routes)
    : parseRoutes(options.routes)

  return co.wrap(function *(ctx, next) {

    /**
     * pick request base path
     */
    var url = ctx.request.url.split('?')[0];

    /**
     * pick request method
     * ['POST']
     */
    var method = ctx.request.method.toUpperCase();

    // is in authed routes ?
    var matched;
    for (var i = 0; i < routes.length; i++) {
      if (pathToRegexp(routes[i].path).exec(url)
        && lodash.includes(routes[i].methods, method)) {
          matched = routes[i].path;
          break;
        }
    }

    if (matched) {
      /**
       * middleware is a Promise fn
       */
      var authorities = yield middleware(ctx, {
        routes: routes,
      });

      /**
       * it passed if return value === true
       */
      if (authorities === true) {
        return yield next();
      }

      /**
       * otherwise check authorities
       */
      if (!lodash.isArray(authorities)) {
        return ctx.throw(401, 'Koa Authority: middleware return must be an Array !');
      }
      if (!lodash.includes(amassRoutes(authorities)[matched], method)) {
        return ctx.throw(401, message);
      }
    }

    yield next();
  });
}

/**
 * parse routes
 */
function parseRoutes(routes) {
  if (!lodash.isArray(routes)) throw new TypeError(checkTypeErrorMsg)
  routes = routes.map(router => {
    if (Object.prototype.toString.call(router).toLowerCase() !== '[object object]') {
      throw new TypeError(checkTypeErrorMsg)
    } else if (!router.path || !router.methods || !lodash.isArray(router.methods)) {
      throw new TypeError(checkTypeErrorMsg)
    } else {
      return Object.assign({}, router, {
        methods: router.methods.join(',').toUpperCase().split(',')
      })
    }
  })
  return routes
}

/**
 * parse koa-router
 */
function parseKoaRouter(router) {
  var map = [];
  (function deep(input) {
    if (lodash.isArray(input)) return lodash.forEach(input, function (each) {
      deep(each);
    });
    if (lodash.has(input, 'stack')) {
      lodash.has(input, 'path')
      ? map.push({
        path: input.path,
        methods: input.methods || [],
      })
      : deep(input.stack);
    }
  })(router);
  return map;
}

/**
 * make routes =>
 * {
 *   [path]: ['POST','GET', ...]
 * },
 * 
 */
function amassRoutes(routes) {
  var amass = {}
  lodash.forEach(routes, function (item) {
    amass[item.path] = lodash.concat(amass[item.path] || [], item.methods);
  })
  return amass;
};

module.exports = KoaAuthority;