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
        "sentryDSN": "", //Make sure you make a new Sentry DSN and add it here
        "useProxy": true, //Defaults to http://proxy:3128, can be overridden with the 'proxy' var in this object
        "sentryTags": ["clientName", "projectName"], //Extra list of config variables that should be added to the Sentry tags when sending in an error payload
        "sentryExtra": ["clientConfig"], //Extra config fields that should be added to the Sentry payload
        "clientConfig": {}
        "clientName": "Client",
        "projectName": "Project"
    }
}).env({
    parseValues: true,
    readOnly: false
});

module.exports = config;
```