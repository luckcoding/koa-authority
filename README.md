# koa-authority

[![npm version](https://img.shields.io/npm/v/koa-authority.svg)](https://www.npmjs.com/package/koa-authority)

This module provides a minimalistic verification, **base on koa-router**.

## Installation

```
npm install koa-authority
```

## Use

**具体使用可参考：[Example](https://github.com/luckcoding/hotchcms)**


```
var koaAuthority = require('koa-authority')
var Router = require('koa-router')

// 将要被校验的路由
var router = new Router()
router.post('/check', function(){})

// koaAuthority 提供更改权限的中间件 (middle)
function authority(routes) {
  reutrn koaAuthority({
    routes: routes,
    middleware: function(ctx, auth) {
      return new Promise(function(resolve, reject) {
        if (err) {
          reject('500')
        }
        if (isAdmin) {
          resolve(auth.scatter)
        } else {
          resolve([])
        }
      })
    }
  })
}

// 使用
app.use(authority(router))
```