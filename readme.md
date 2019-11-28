![CircleCI](https://img.shields.io/circleci/build/github/Makeshift/connor-base-config?style=plastic) ![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/makeshift/connor-base-config?style=plastic) ![GitHub release](https://img.shields.io/github/release/makeshift/connor-base-config?style=plastic) ![Dependent repos (via libraries.io)](https://img.shields.io/librariesio/dependent-repos/npm/connor-base-config?style=plastic)
# Connor's Base Config Package

I tend to use this boilerplate package for configuration. It adds a basic config object with some useful data in it, which you can then add to to have a nice global repository store. Designed to work with my [logging boilerplate package](https://github.com/Makeshift/connor-base-log).

This uses a modified version of [convict](https://github.com/mozilla/node-convict) but completely destroys its core principles by making the schema dynamic. I wanted this so I could stack packages on top of each other and add new schemas for each package.

The config is stored as a global symbol. Every time you require `connor-base-config` it will be referencing the same config variable. This means that no matter where you load config in your project, it will be available to every module that requires it.

### Features
* Follows [Convict](https://github.com/mozilla/node-convict)'s schemas and maintains its API - Should be a drop-in replacement for most.
* JSON5 by default
* Stackable schema
* Stored as a globally consistent singleton
* Can load config from various sources (env vars, arguments, in-line)
* Optional validation
* Optionally load config before loading the schema

### Install
`npm install connor-base-config`

### Boilerplate snippet
```javascript
// This can be copied into new projects as boilerplate for config
// config.js

const config = require('connor-base-config');

config.load({
    "environment.level": "production",
    "metadata.stack": {
        MyItem: true
    }
});

//Add additional values to the schema
config.addToSchema({
   test: {
     name: {
      doc: "What's the name of the task we're doing?",
      format: "String",
      default: "None",
      env: "JOB_NAME"
    }
   }
})

//Load additional config to the newly updated schema
config.load({
  test: {
      name: "Testing"
  }
})

//console.log(config.getProperties());
console.log(config.get("test.name"))

module.exports = config;
```

Or as a shortened example:
```javascript
const config = require('connor-base-config')
               .addToSchema(require('./job_schema.json5'))
               .addToSchema(require('./task_schema.json5'))
               .set("task.name", "My Awesome Task")
```

### How should I lay out my config?
I haven't enforced any particular layout, but my go-to is to essentially use namespaces. Each package that adds its own schema on top gets its own namespace, so you end up with something like this:
```javascript
{
    metadata: {...},
    task: { //new "namespace"
        name: "Convert a file",
        format: "csv",
        csv: { //new "namespace"
            delimiter: ",",
            escapecharacter: "\""
        }
    }
}
```

### Extra Commands
For the full list of commands and how schemas work, check [Convict](https://github.com/mozilla/node-convict)'s repo.
This fork adds the following two functions to the config prototype:

`addToSchema`: Takes a JSON/JSON5 blob and appends it to the current schema, re-applying all config values on top of the new schema. This can also be used to _overwrite_ parts of the old current schema, but that isn't recommended behaviour.

`updateSchema`: Takes a JSON/JSON5 blob and replaces the entire current schema with it, re-applying all config values on top of the new schema.

This fork also modifies Convict's `getSchema` and `getSchemaString` to no longer transform them, so you'll get back exactly what you put in.