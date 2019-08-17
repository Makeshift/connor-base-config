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

const settings = {
    //Overrides from the base config
    "sentry": {dsn: "test"}, //Make sure you make a new Sentry DSN and add it here
    "proxy": {enabled: true}, //Defaults to http://proxy:3128, can be overridden with the 'proxy' var in this object
    "sentry": {
        tags: ["client.name", "client.project"], //Extra list of config variables that should be added to the Sentry tags when sending in an error payload
        extra: ["client"]
    }, 
    "logging": {level: "verbose"},
    "client": {
        name: "PLACEHOLDER",
        project: "PLACEHOLDER"
    }
}

const config = require('./config')(schema, settings);

config.validate();

console.log(config.getProperties())

module.exports = config;