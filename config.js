const convict = require('convict');
const tty = require('tty');
const parent = require('parent-package-json');
const myPackage = require('./package.json');
require('json5/lib/register');
const baseSchema = require('./base_schema.json5');
const exec = require('child_process').execSync;

let globalConfigObject;

function createConfigObject(schema) {
    let conf = convict(schema);
    conf.updateSchema = (schema, validate = true) => {
        let currentProperties = conf.getProperties();
        let newConfig = createConfigObject(schema);
        newConfig.load(currentProperties);
        if (validate) newConfig.validate();
        globalConfigObject = newConfig;
        return newConfig;
    };

    conf.addToSchema = (newSchema, validate) => {
        return conf.updateSchema({...conf.getSchema(), ...newSchema}, validate)
    };

    return conf;
}

let parentCount = 0;
let stackVersions = {};
let parentPath = "";
stackVersions[myPackage.name] = myPackage.version;

//Iterate over parent modules to expose version and app info to everyone
while (parent(__dirname, parentCount) !== false) {
    let parentPackage = parent(__dirname, parentCount).parse();
    stackVersions[parentPackage.name] = parentPackage.version;
    parentPath = parent(__dirname, parentCount).path;
    parentCount++
}

function getRegion() {
    //TODO: Look into http://169.254.169.254/latest/meta-data/
    return process.env["region"] || process.env["AWS_REGION"] || "us-east-2";
}

function getEnvironment() {
    //TODO: There are better ways to do this...
    if (tty.isatty(process.stdout.fd) || process.env["WebStorm"] || process.env["USERNAME"] === "Connor" || process.env["NODE_ENV"] === "development") {
        return "development"
    }
    return "production";
}

globalConfigObject = createConfigObject(baseSchema);
globalConfigObject.load({
    metadata: {
        parentPath: parentPath,
        package: Object.keys(stackVersions)[stackVersions.length - 1] || myPackage.name,
        version: stackVersions[stackVersions.length - 1] || myPackage.version,
        stack: stackVersions
    },
    logging: {
        colors: getEnvironment() === "develop"
    },
    environment: {
        level: getEnvironment(),
        region: getRegion()
    }
});

try {
    if (require.main === module) parentPath = __dirname;
    if (globalConfigObject.get("debug.fullstack.enabled")) globalConfigObject.set("debug.fullstack.stack", exec(`npm ls --${getEnvironment()}`, {cwd: parentPath}).toString());
} catch (e) {
    console.log("Failed to get the full package stack - is NPM installed?")
}

globalConfigObject.validate();


module.exports = globalConfigObject;