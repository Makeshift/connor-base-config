const convict = require('convict');
const merge = require('deepmerge');
const tty = require('tty');
const myPackage = require('./package.json');
const parentPackage = require('parent-package-json');
require('json5/lib/register');
const baseSchema = require('./base_schema.json5');
convict.addParser({
  extension: 'json',
  parse: require('json5').parse
});
convict.addFormats(require('./validator'));
// Fixes booleans from env vars
convict.addFormat({
  name: 'Boolean',
  validate: val => typeof val === 'boolean',
  coerce: val => {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true';
    }
    return val;
  }
});
// Allow array children to be validated with a schema properly
convict.addFormat({
  name: 'Array',
  validate: function (sources, schema) {
    if (!Array.isArray(sources)) {
      throw new Error('must be of type Array');
    }
  },
  coerce: function (val, instance, key, schema) {
    // The schema for this array has a schema - Let's load it
    if (schema.children) {
      const sanitisedArray = [];
      for (const item of val) {
        const coercedKey = convict(schema.children).load(item);
        coercedKey.validate();
        sanitisedArray.push(coercedKey.getProperties());
      }
      return sanitisedArray;
    } else {
      return val;
    }
  }
});
const KEY_NAME = 'connor.base.config';
const KEY = Symbol.for(KEY_NAME);

class ConnorConf extends convict {
  constructor (schema) {
    super(schema);
    let parentCount = 0;
    const stackVersions = {};
    let parentPath = '';
    stackVersions[myPackage.name] = myPackage.version;

    // Iterate over parent modules to expose version and app info to everyone
    while (!parentPackage(__dirname, parentCount)) {
      const currentParentPackage = parentPackage(__dirname, parentCount).parse();
      stackVersions[currentParentPackage.name] = currentParentPackage.version;
      parentPath = parentPackage(__dirname, parentCount).path;
      parentCount++;
    }
    this.convictLoad = this.load;
    this.load = (data, validate = true) => {
      this.convictLoad(data);
      if (validate) this.validate();
    };

    this.originalConstructor = convict;

    this.load({
      metadata: {
        parentPath: parentPath,
        package: Object.keys(stackVersions).pop() || myPackage.name,
        release: stackVersions[Object.keys(stackVersions).pop()] || myPackage.version,
        stack: stackVersions
      },
      // TODO: This is dumb
      environment: {
        level: process.env.ENV_LEVEL ? process.env.ENV_LEVEL : (tty.isatty(process.stdout.fd) || process.env.WebStorm || process.env.USERNAME === 'Connor' || process.env.NODE_ENV === 'development') ? 'development' : 'production',
        region: process.env.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'NO_REGION_SET'
      }
    });

    this.validate();

    this.updateSchema = (schema, validate = true) => {
      const newConfig = new ConnorConf(schema);
      newConfig.load(global[KEY].getProperties());
      if (validate) newConfig.validate();
      global[KEY] = newConfig;
      return createSingleton();
    };
    this.addToSchema = (newSchema, validate) => {
      return this.updateSchema(merge(global[KEY].getSchema(), newSchema), validate);
    };

    this.addFormat = (format, validate) => {
      convict.addFormat(format);
      return this.updateSchema(global[KEY].getSchema(), validate);
    };
  }
}

if (!Object.getOwnPropertySymbols(global).includes(KEY)) {
  global[KEY] = new ConnorConf(baseSchema);
}

const createSingleton = () => {
  const singleton = {
    // Debugging keys
    globalKeyName: KEY_NAME,
    sourceFile: __filename,
    sourceVersion: myPackage.version

  };
  Object.keys(global[KEY]).forEach(configKey => {
    Object.defineProperty(singleton, configKey, {
      get: () => global[KEY][configKey]
    });
  });
  return singleton;
};

module.exports = createSingleton();
