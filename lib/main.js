/**
 * A simple workflow for web crawling
 * have fun to crawl the web :)
 */

var events = require('events')
  , util = require('util')
  , url = require('url')
  , request = require('request')
  , Pool = require('generic-pool').Pool;


/**
 * A simple wrapper for `Request`
 *
 * @param {Object} opts
 *    must contain a 'url' field
 * @return {Object} opts
 * @api public
 */

function Request(opts) {
  opts.url = url.parse(opts.url);
  opts.method = (opts.method && opts.method.toUpperCase()) || 'GET';
  opts.headers = opts.headers || {};
  opts.encoding = 'utf-8';
  return opts;
}


/**
 * A simple wrapper for `Response`
 *
 * @param {Object} opts
 *    default {}
 * @return {Object} opts
 * @api private
 */

function Response(opts) {
  opts.header = opts.header || {};
  opts.body = opts.body || '';
  return opts;
}


/**
 * A simple `Router` to handle `Response`
 * 
 * @api private
 */

function Router() {
  this.rules = [];
}

/**
 * Add (rule, spider) pair to `Router.rules`
 *
 * @param {string|RegExp} rule
 * @param {Spider} spider
 * @return {Router} self
 *    for chain use
 */
Router.prototype.add = function(rule, spider) {
  this.rules.push({
    rule: (rule instanceof RegExp) ? rule : new RegExp(rule),
    spider: spider,
  });
  return this;
}

/**
 * A simple function to send the `Response` to `Spider`(s)
 *    one response can be sended to multi spiders
 *
 * @param {Response} res
 */
Router.prototype.route = function(res) {
  this.rules.forEach(function(rule) {
    if (rule.rule.test(res.url)) {
      rule.spider.emit('response', res);
    }
  });
}


/**
 * Initialize a new `Engine`
 *
 * @param {Object} opts
 *    default {maxConnection: 4, log: false}
 * @api public
 */

function Engine(opts) {
  if (!(this instanceof Engine)) return new Engine(opts);
  opts = opts || {};
  opts.maxRequests = opts.maxRequests || 4;
  opts.log = opts.log || false;
  this.startURLs = opts.startURLs || [];
  this.config = opts;

  this.router = new Router();
  this.pool = new Pool({
    name: 'request',
    create: function(callback) {
      callback(null);
    },
    destroy: function() {},
    max: opts.maxRequests,
    min: 0
  });

  this.on('request', this.handleRequest);
  this.on('response', this.handleResponse);
  this.on('error', this.handleError);
}

util.inherits(Engine, events.EventEmitter);

/**
 * A function to handle `Request`
 *    send `Request` and fetch `Response`
 *
 * @param {Request} req
 */
Engine.prototype.handleRequest = function(req) {
  var self = this;
  this.pool.acquire(function() {
    request(req, function(err, res, body) {
      if (!err && res.statusCode == 200) {
        self.emit('response', new Response({
          method: req.method,
          url: req.url,
          body: body.toString()
        }));
      } else {
        self.emit('error', error);
      }
      self.pool.release();
    });
  });
}

/**
 * A function to handle `Response`
 *    simply let `Router` do routing stuff
 *
 * @param {Response} res
 */
Engine.prototype.handleResponse = function(res) {
  this.router.route(res);
}

/**
 * Handle `Error` on `Engine`
 *
 * @param {Error} err
 *
 * TODO:
 *   need a mechanism to handle `Error`
 */
Engine.prototype.handleError = function(err) {
  if (self.config.log === true) {
    console.error(err);
  }
}

/**
 * A function to registe a `Spider` on a rule
 *
 * @param {string|RegExp} rule
 *    default /^.*$/
 * @param {Spider} spider
 * @return {Engine} self
 *    for chain use
 */
Engine.prototype.route = function(rule, spider) {
  if (!spider) {
    spider = rule;
    rule = new RegExp(/^.*$/);
  }
  this.router.add(rule, spider);
  return this;
}

/**
 * Start the `Engine` to run
 */
Engine.prototype.run = function() {
  var self = this;
  this.startURLs.forEach(function(v) {
    if (typeof v === 'string') {
      self.emit('request', new Request({url: v}));
    } else {
      self.emit('request', new Request(v));
    }
  });
}


/**
 * Initialize a new `Spider`
 *
 * @param {string} name
 *    default 'fun'
 * @api public
 */

function Spider(name) {
  if (!(this instanceof Spider)) return new Spider(name);
  this.name = name || 'fun';
}

util.inherits(Spider, events.EventEmitter);

/**
 * Module exports
 */
exports.Engine = Engine;
exports.Spider = Spider;
exports.Request = Request;
