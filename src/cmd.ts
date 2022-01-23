#!/usr/bin/env node
import { resolveModule } from "./Path";

// Symlinks in Windows resolve to an upper-case drive letter,
// so make sure we load everything with an upper-case drive letter to avoid double-loading any modules
// (except for Path and this one, but that shouldn't cause any problems).
require(resolveModule("./CommandLine"));