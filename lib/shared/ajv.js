"use strict";

const Ajv = require("ajv");

module.exports = new Ajv({
    allErrors: true,
    verbose: true
});
