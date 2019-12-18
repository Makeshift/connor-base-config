const convict = require('convict');
const tty = require('tty');
const myPackage = require('./package.json');
const parentPackage = require('parent-package-json');
require('json5/lib/register');
const baseSchema = require('./base_schema.json5');
convict.addParser({extension: 'json', parse: require('json5').parse});
//Fixes booleans from env vars
convict.addFormat({
    name: "Boolean",
    validate: val => typeof val === "boolean",
    coerce: val => val.toLowerCase() === "true"
});
const KEY_NAME = "connor.base.config"
const KEY = Symbol.for(KEY_NAME);

class connorConf extends convict {
    constructor(schema) {
        super(schema)
        let parentCount = 0;
        let stackVersions = {};
        let parentPath = "";
        stackVersions[myPackage.name] = myPackage.version;

        //Iterate over parent modules to expose version and app info to everyone
        while (!parentPackage(__dirname, parentCount)) {
            let currentParentPackage = parentPackage(__dirname, parentCount).parse();
            stackVersions[currentParentPackage.name] = currentParentPackage.version;
            parentPath = parentPackage(__dirname, parentCount).path;
            parentCount++
        }
        this.load({
            metadata: {
                parentPath: parentPath,
                package: Object.keys(stackVersions).pop() || myPackage.name,
                release: stackVersions[Object.keys(stackVersions).pop()] || myPackage.version,
                stack: stackVersions
            },
            //TODO: This is dumb
            environment: {
                level: process.env["ENV_LEVEL"] ? process.env["ENV_LEVEL"] : (tty.isatty(process.stdout.fd) || process.env["WebStorm"] || process.env["USERNAME"] === "Connor" || process.env["NODE_ENV"] === "development") ? "development" : "production",
                region: process.env["region"] || process.env["AWS_REGION"] || process.env["AWS_DEFAULT_REGION"] || "NO_REGION_SET",
                proxy: {
                    enabled: !!(process.env["HTTP_PROXY"] || process.env["HTTPS_PROXY"]),
                    //address: (process.env["HTTP_PROXY"] || process.env["HTTPS_PROXY"]) ? (process.env["HTTP_PROXY"] || process.env["HTTPS_PROXY"]) : ""
                }
            }
        })

        this.validate();

        this.updateSchema = (schema, validate=true) => {
            let newConfig = new connorConf(schema);
            newConfig.load(global[KEY].getProperties());
            if (validate) newConfig.validate();
            global[KEY] = newConfig;
            return createSingleton()
        }
        this.addToSchema = (newSchema, validate) => {
            return this.updateSchema(Object.assign(global[KEY].getSchema(), newSchema), validate)
        }
    }
}

if (!Object.getOwnPropertySymbols(global).includes(KEY)) {
    global[KEY] = new connorConf(baseSchema);
}

let createSingleton = () => {
    let singleton = {
        //Debugging keys
        globalKeyName: KEY_NAME,
        sourceFile: __filename,
        sourceVersion: myPackage.version,

    };
    Object.keys(global[KEY]).forEach(configKey => {
        Object.defineProperty(singleton, configKey, {
            get: () => global[KEY][configKey]
        })
    })
    return singleton
}

module.exports = createSingleton()