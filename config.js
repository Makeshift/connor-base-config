const convict = require('convict');
const tty = require('tty');
const parent = require('parent-package-json');
const myPackage = require('./package.json');
require('json5/lib/register');
const baseSchema = require('./base_schema.json5');

module.exports = (schema = {}) => {
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
        if (tty.isatty(process.stdout.fd) || process.env["WebStorm"] || process.env["USERNAME"] === "Connor") {
            return "development"
        }
        return "production";
    }

    let fullSchema = Object.assign(baseSchema, schema);

    let config = convict(fullSchema);
    config.load({
        metadata: {
            parentPath: parentPath,
            package: Object.keys(stackVersions)[stackVersions.length - 1] || "connor-base-config",
            version: stackVersions[stackVersions.length - 1] || "0",
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
    const exec = require('child_process').execSync;
    try {
        if (require.main === module) parentPath = __dirname;
        if (config.get("debug.fullstack.enabled")) config.set("debug.fullstack.stack", exec(`npm ls --${getEnvironment()}`, {cwd: parentPath}).toString());
    } catch (e) {
        console.log("Failed to get the full package stack - is NPM installed?")
    }

    config.validate();

    return config;
};