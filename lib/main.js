/**
 * A simple workflow for web scraping
 * have fun to scrapy the web :)
 */

var events = require('events')
  , util = require('util')
  , url = require('url')
  , request = require('request')
  , Pool = require('generic-pool').Pool;


/**
 * A simple wrapper for `Request`
 *
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
 * @api public
 */

function Router() {
  this.rules = [];
}

Router.prototype.add = function(rule, spider) {
  if (!spider) {
    spider = rule;
    rule = new RegExp(/^.*$/);
  }
  this.rules.push({
    rule: (rule instanceof RegExp) ? rule : new RegExp(rule),
    spider: spider,
  });
};

Router.prototype.route = function(res) {
  this.rules.forEach(function(rule) {
    if (rule.rule.test(res.url)) {
      rule.spider.emit('response', res);
    }
  });
};


/**
 * Initialize a new `Engine`
 *
 * @param {Object} opts
 * @api public
 */

function Engine(opts) {
  if (!(this instanceof Engine)) return new Engine(opts);
  opts = opts || {};
  opts.maxRequests = opts.maxRequests || 4;
  this.startURLs = opts.startURLs || [];

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
};

Engine.prototype.handleResponse = function(res) {
  this.router.route(res);
};

Engine.prototype.handleError = function(err) {
  if (self.config.log === true) {
    console.error(err);
  }
};

Engine.prototype.route = function(rule, spider) {
  this.router.add(rule, spider);
  return this;
};

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
 * @api public
 */

function Spider(name) {
  if (!(this instanceof Spider)) return new Spider(name);
  this.name = name || 'fun';
}

util.inherits(Spider, events.EventEmitter);


exports.Engine = Engine;
exports.Spider = Spider;
exports.Request = Request;
