export type ConfigLoader<T> = (input: T) => Record<AnyKey, any>
