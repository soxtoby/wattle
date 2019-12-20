import * as chokidar from 'chokidar';

export class DependencyWatcher {
    private watcher?: chokidar.FSWatcher;
    private readonly dependencies: { [module: string]: Set<string> } = {};
    private readonly dependants: { [dependency: string]: Set<string> } = {};

    constructor(private onDependencyChanged: (dependants: string[]) => void) { }

    start() {
        if (!this.watcher)
            this.watcher = chokidar.watch(Object.keys(this.dependants),
                {
                    ignoreInitial: true,
                    disableGlobbing: true,
                    awaitWriteFinish: true,
                    atomic: true
                })
                .on('change', file => this.onDependencyChanged(Array.from(this.dependants[file])));
    }

    updateDependencies(module: string, dependencies: string[]) {
        let oldDependencies = this.dependencies[module] || new Set();
        let newDependencies = new Set(dependencies);

        for (let dep of oldDependencies) {
            if (!newDependencies.has(dep)) {
                this.dependants[dep].delete(module);
                if (!this.dependants[dep].size) {
                    delete this.dependants[dep];
                    if (this.watcher)
                        this.watcher.unwatch(dep);
                }
            }
        }

        for (let dep of newDependencies) {
            if (!oldDependencies.has(dep)) {
                if (!this.dependants[dep]) {
                    this.dependants[dep] = new Set();
                    if (this.watcher)
                        this.watcher.add(dep);
                }
                this.dependants[dep].add(module);
            }
        }

        this.dependencies[module] = newDependencies;
    }

    stop() {
        if (this.watcher)
            this.watcher.close();
        delete this.watcher;
    }
}

export function reloadDependencies(module: string) {
    [module].concat(dependencies(module))
        .forEach(m => delete require.cache[m]);
}

export function dependencies(module: string) {
    let dependencies = new Set<string>();
    findDependencies(module);
    dependencies.delete(module);
    wattleDependencies().forEach(d => dependencies.delete(d));
    return Array.from(dependencies);

    function findDependencies(module: string) {
        if (dependencies.has(module))
            return;

        let info = require.cache[module] as NodeModule;
        if (!info)
            return;

        dependencies.add(info.filename);
        info.children.forEach(c => findDependencies(c.filename));
    }
}

let wattleDeps: string[];

function wattleDependencies() {
    if (wattleDeps)
        return wattleDeps;

    wattleDeps = []; // Stop infinite recursion
    require('./index'); // Make sure wattle is in the require cache
    wattleDeps = dependencies(require.resolve('./index'));
    return wattleDeps;
}