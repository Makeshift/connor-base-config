let config = require('./config');
console.log(config.get("environment.level"))

config.addToSchema({
    job: {
        name: {
            doc: "What's the name of the task we're doing?",
            format: "String",
            default: "None",
            env: "JOB_NAME"
        }
    }
}, true);

config.load({
    job: "Test"
})

console.log(config.get("job"))

config = require('./config')
console.log(config.get("job"))