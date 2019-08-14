I tend to use this boilerplate package for configuration. It adds a basic config object with some useful data in it, which you can then add to to have a nice global repository store. Designed to work with my [logging boilerplate package](https://github.com/Makeshift/connor-base-log).

### Install
`npm install github:makeshift/connor-base-config`

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