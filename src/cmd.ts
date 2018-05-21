#!/usr/bin/env node
import findup = require('findup-sync');

let localCommandLineRunner = findup('node_modules/wattle/lib/CommandLineRunner.js');

if (!localCommandLineRunner)
    throw new Error("Couldn't find local wattle installation");

require(localCommandLineRunner);