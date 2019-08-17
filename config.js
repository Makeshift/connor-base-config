const nconf = require('nconf');
const tty = require('tty');
const parent = require('parent-package-json');

const myPackage = require('./package.json');
let parentCount = 0;
let stackVersions = {};
let parentPath = "";
stackVersions[myPackage.name] = myPackage.version;

//Iterate over parent modules to expose version and app info to everyone
while (parent(__dirname, parentCount) !== false) {
    let parentPackage = parent(__dirname, parentCount).parse();
    stackVersions[parentPackage.name] = parentPackage.version;
    parentPath = parent(__dirname, parentCount).path;
    parentCount++;
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

nconf
    .use('memory')
    .argv()
    .env({
        parseValues: true,
        readOnly: false
    })
    .defaults({
        "baseSentryTags": ["package", "version", "useProxy", "logLevel", "region", "environment"], //List of config variables that should be added to the Sentry tags when sending in an error payload
        "baseSentryExtra": ["stack", "fullStack"], //List of 'extra' fields that should be added to Sentry payloads
        "parentPath": parentPath,
        "package": Object.keys(stackVersions)[stackVersions.length - 1],
        "version": stackVersions[stackVersions.length - 1],
        "stack": stackVersions,
        "fullStack": [],
        "useProxy": false,
        "proxy": "http://proxy:3128",
        "useSentry": true,
        //Should be overwritten when imported!
        "sentryDSN": "https://9e0bf25f123942eab895423780eb9900@sentry.ficoccs-prod.net/18",
        "logLevel": "info",
        "region": getRegion(),
        "environment": getEnvironment(),
        "colors": getEnvironment() === "develop"
    });

const exec = require('child_process').execSync;
try {
    nconf.set("fullStack", JSON.parse(exec(`npm ls --json --${getEnvironment()}`, {cwd: parentPath})));
} catch(e) {
    console.log("Failed to get the full package stack - is NPM installed?")
}


module.exports = nconf;