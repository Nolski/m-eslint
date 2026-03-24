#!/usr/bin/env node
"use strict";
(async () => {
    const cli = require("../lib/cli");
    const exitCode = await cli.execute(process.argv);
    process.exitCode = exitCode;
})().catch(err => {
    console.error(err);
    process.exitCode = 2;
});
