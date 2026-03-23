import { PluginContext } from "./Context"

export interface Plugin<Config extends object> {
    name: string
    onConfigResolved?(this: void, config: Config): Promise<Config> | Config
    onLoad?(context: PluginContext): void
}
