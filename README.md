# koa-authority

[![npm version](https://img.shields.io/npm/v/koa-authority.svg)](https://www.npmjs.com/package/koa-authority)

This module provides a minimalistic verification.

## Installation

```
npm install koa-authority
```

## Use

**real example：[==> hotchcms](https://github.com/luckcoding/hotchcms)**

### example 1

> use koa-router

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
    useKoaRouter: true,
    middleware: function(ctx, { routes }) {
      return new Promise(function(resolve, reject) {
        if (err) return reject('500')
        if (isAdmin) {
          resolve(routes) // or resolve(true)
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

### example 2

> whitout koa-router

```
var koaAuthority = require('koa-authority')

// koaAuthority 提供更改权限的中间件 (middle)
function authority(routes) {
  reutrn koaAuthority({
    routes: routes,
    middleware: function(ctx, { routes }) {
      return new Promise(function(resolve, reject) {
        if (err) return reject('500')
        if (isAdmin) {
          resolve(routes) // or resolve(true)
        } else {
          resolve([])
        }
      })
    }
  })
}

// 使用
app.use(authority([
  {
    path: 'api/user',
    methods: ['POST'],
  },
  {
    path: 'api/content/xxx',
    methods: ['GET','HEAD', ...],
  },
  ...
]))
```

## options

* **routes**. `koa-router` Object or an Array like `[{path:'',methods:['GET'...]}...]`
* **useKoaRouter**. Bollean, default false, *use koa-router ?*
* **middleware**. Function, *return a Promise*.