I tend to use this boilerplate package for configuration. It adds a basic config object with some useful data in it, which you can then add to.

### Boilerplate snippet
```
// This can be copied into new projects as boilerplate for config
const config = require('connor-base-config');

config.add('boilerplate', {
    type: "literal",
    store: {
        "sentryDSN": "",
        "useProxy": true
    }
}).env({
    parseValues: true,
    readOnly: false
});

module.exports = config;
```