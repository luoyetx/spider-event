spider-event
============

A simple evented web scraping framework using node.js

### install

```
$ npm install spider-event
```

### example

```javascript
var core = require('spider-event');

var engine = new core.Engine();
engine.startURLs = [
  'http://www.xiami.com/',
  'https://www.npmjs.org/'
];

var spider1 = new core.Spider();
spider1.on('response', function(response) {
  console.log('Response status: ', 200);
  console.log('Response body: ', response.body.slice(0,20));
});

spider1.on('error', function(err, resquest, response) {
  console.error('An error happened!');
});

engine.route(spider1);

engine.run();
```

### More
Read the code to see it's so simple, welcome to fork and contribute.
