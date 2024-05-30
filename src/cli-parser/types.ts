/**
 * Use 'boolean' for flag-type args
 */
export type CliSchemaValueType = 'string' | 'number' | 'boolean'

export type CliSchemaName<T extends string = string> = `-${T}`

export type CliSchema<
	TName extends string = string,
	TAliases extends CliSchemaName<string>[] | undefined = CliSchemaName<string>[],
	TType extends CliSchemaValueType = CliSchemaValueType,
	TRequired extends boolean = boolean
> = {
	name: CliSchemaName<TName>
	aliases?: TAliases
	type: TType
	isRequired: TRequired
}

export type ExtractAliasesSubfunc<TCliSchema extends CliSchema> = {
	[Key in TCliSchema as Key['name']]: Extract<TCliSchema, { name: Key['name'] }>['aliases'] extends Array<
		infer R extends CliSchemaName
	>
		? R
		: never
}[TCliSchema['name']]

export type ExtractAliasesFromParams<
	TCliSchemas extends CliSchemas,
	TCliSchema extends CliSchema = TCliSchemas[number]
> = TCliSchema['name'] | ExtractAliasesSubfunc<TCliSchema>

export type ExtractAliasesFromParam<TCliSchema extends CliSchema> =
	| TCliSchema['name']
	| ExtractAliasesSubfunc<TCliSchema>

export type CliSchemas<TParam extends CliSchema = CliSchema> = TParam[]

export type ValidatedCliSchemas<TCliSchemas extends CliSchemas = CliSchemas> = Branded<TCliSchemas, 'VALID'>

export type CliSchemaSingleAlias<TCliSchemas extends CliSchemas, TCliSchema extends CliSchema = TCliSchemas[number]> = {
	name: TCliSchema['name']
	alias: ExtractAliasesFromParams<TCliSchemas>
	type: TCliSchema['type']
	isRequired: TCliSchema['isRequired']
}

/**
 * Variation meant for usage inside generic functions where string literal types are unclear.
 *
 * Warning: lacks necessary type checks.
 *
 * NEVER output it to user without prior conversion to `CliSchemaSingleAlias`.
 */
export type CommonCliSchemaSingleAlias = {
	name: string
	alias: string
	type: CliSchemaValueType
	isRequired: boolean
}

export type ExtractCliValueType<T extends CliSchemaValueType> = T extends 'string'
	? string
	: T extends 'number'
	? number
	: T extends 'boolean'
	? true
	: never

export type TrimDashes<Source extends string> = Source extends `-${infer Tail}` ? TrimDashes<Tail> : Source

export type ExtractCliParamsOutput<
	TCliSchemas extends CliSchemas,
	TCliSchema extends CliSchema = TCliSchemas[number]
> = {
	[K in Extract<TCliSchema, { isRequired: false }> as TrimDashes<K['name']>]?: ExtractCliValueType<K['type']>
} & {
	[K in Extract<TCliSchema, { isRequired: true }> as TrimDashes<K['name']>]: ExtractCliValueType<K['type']>
}

/**
 * Variation meant for usage inside generic functions where string literal types are unclear.
 *
 * Warning: lacks necessary type checks.
 *
 * NEVER output it to user without prior conversion to `ExtractedCliSchemas`.
 */
export type CommonExtractedCliSchemas = {
	[Param: string]: ExtractCliValueType<CliSchemaValueType>
}

export type LoadedConfigParams = Record<AnyKey, any>

export type MergedRecords<T extends Record<AnyKey, any>, U extends Record<AnyKey, any>> = {
	[K in keyof T]: T[K] extends never ? U[K] : T[K]
}

export type CliSchemaDuplicateErrorStorage<
	TCliSchemas extends CliSchemas,
	TCliSchema extends CliSchema = TCliSchemas[number]
> = {
	[Param in TCliSchema as Param['name']]?: Array<ExtractAliasesFromParam<Param>>
}

export type CliSchemaTypeErrorBody<TValueType extends CliSchemaValueType = CliSchemaValueType> = {
	expected: TValueType
	receivedValue: any
}

/**
 * Variation meant for usage inside generic functions where string literal types are unclear.
 *
 * Warning: lacks necessary type checks.
 *
 * NEVER output it to user without prior conversion to `CliSchemaDuplicateErrorStorage`.
 */
export type CommonCliSchemaDuplicateErrorStorage = {
	[Param in string]?: string[]
}

/**
 * Variation meant for usage inside generic functions where string literal types are unclear.
 *
 * Warning: lacks necessary type checks.
 *
 * NEVER output it to user without prior conversion to `CliSchemaTypeErrorStorage`.
 */
export type CommonCliSchemaTypeErrorStorage = {
	[Param in string]?: CliSchemaTypeErrorBody
}
