![CircleCI](https://img.shields.io/circleci/build/github/Makeshift/connor-base-config?style=plastic) ![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/makeshift/connor-base-config?style=plastic) ![GitHub release](https://img.shields.io/github/release/makeshift/connor-base-config?style=plastic) ![Dependent repos (via libraries.io)](https://img.shields.io/librariesio/dependent-repos/npm/connor-base-config?style=plastic)
# Connor's Base Config Package

I tend to use this boilerplate package for configuration. It adds a basic config object with some useful data in it, which you can then add to to have a nice global repository store. Designed to work with my [logging boilerplate package](https://github.com/Makeshift/connor-base-log).

### Install
`npm install connor-base-config`

### Boilerplate snippet
```
// This can be copied into new projects as boilerplate for config
// config.js
const schema = {
    "client": {
        doc: "Client-specific configuration",
        format: "Object",
        default: {},
        env: "CLIENT_CONFIG"
    },
    "custom": {
        other: {
            doc: "Other config specific to this application",
            format: "String",
            default: "",
            env: "CUSTOM_OTHER"
        }
    }
}

const config = require('connor-base-config')(schema);

config.load({
    //Overrides from the base config
    "proxy": {enabled: true}, //Defaults to http://proxy:3128, can be overridden with the 'proxy' var in this object
    "sentry": {
        dsn: "https://asdf@sentry.ficoccs-prod.net/asfasf", //Make sure you make a new Sentry DSN and add it here
        tags: ["client.name", "client.project"], //Extra list of config variables that should be added to the Sentry tags when sending in an error payload
        extra: ["client"]
    },
    "logging": {level: "verbose"},
    "client": {
        name: "PLACEHOLDER",
        project: "PLACEHOLDER"
    }
});

config.validate();

//console.log(config.getProperties());

module.exports = config;
```