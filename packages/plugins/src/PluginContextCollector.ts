import type {
    PluginContext,
    SourceTransformHookProvider,
    StageHookProvider,
    EmitHookProvider,
    CleanupHookProvider,
} from "@mochi-css/config";
import type {
    AstPostProcessor,
    EmitHook,
    OnDiagnostic,
    StageDefinition,
} from "@mochi-css/builder";

/**
 * A simple collector that implements {@link PluginContext} by gathering all registered
 * hooks into arrays. Call {@link PluginContextCollector.getStages}, etc. after
 * `plugin.onLoad(collector)` to extract the collected hooks for use in Builder.
 */
export class PluginContextCollector implements PluginContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly _stages: StageDefinition<any[], any>[] = [];
    private readonly _sourceTransforms: AstPostProcessor[] = [];
    private readonly _emitHooks: EmitHook[] = [];
    private readonly _cleanupFns: (() => void)[] = [];

    readonly filePreProcess = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        registerTransformation: (_t: unknown, _d: unknown) => {},
    };

    readonly stages: StageHookProvider = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        register: (s: StageDefinition<any[], any>) => {
            this._stages.push(s);
        },
    };

    readonly sourceTransforms: SourceTransformHookProvider = {
        register: (h: AstPostProcessor) => {
            this._sourceTransforms.push(h);
        },
    };

    readonly emitHooks: EmitHookProvider = {
        register: (h: EmitHook) => {
            this._emitHooks.push(h);
        },
    };

    readonly cleanup: CleanupHookProvider = {
        register: (fn: () => void) => {
            this._cleanupFns.push(fn);
        },
    };

    readonly onDiagnostic: OnDiagnostic;

    constructor(onDiagnostic?: OnDiagnostic) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onDiagnostic = onDiagnostic ?? (() => {});
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getStages(): readonly StageDefinition<any[], any>[] {
        return [...this._stages];
    }

    getSourceTransforms(): AstPostProcessor[] {
        return [...this._sourceTransforms];
    }

    getEmitHooks(): EmitHook[] {
        return [...this._emitHooks];
    }

    runCleanup(): void {
        for (const fn of this._cleanupFns) fn();
    }
}
