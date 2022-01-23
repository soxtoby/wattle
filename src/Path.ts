import { resolve, normalize } from "path";

export function requirePath(path: string) {
    return require(resolvePath(path));
}

export function resolvePath(path: string) {
    return normalizeFilePath(resolve(path));
}

export function resolveModule(module: string) {
    return normalizeFilePath(require.resolve(module));
}

/** 
 * VSCode uses lower-case drive letters, but symlinks are always resolved with upper-case drive letters,
 * causing modules to be loaded twice with different drive letter casing.
 * This normalizes drive letters to upper-case, since we can control the entry points, but not the symlinks.
 */
export function normalizeFilePath(filePath: string) {
    return normalize(filePath).replace(/^[a-z]:/, drive => drive.toUpperCase());
}