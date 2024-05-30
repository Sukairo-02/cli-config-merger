import { parseCliParams, type MergedRecords, type ValidatedCliSchemas, ExtractCliParamsOutput } from 'cli-parser'
import { parseObjectMultiSchema, type Intersect, type ObjectSchema, type SchemaOutput } from 'schema-parser'

import type { ConfigLoader } from './types'

function mergeWithoutOverrides<TCliParams extends Record<AnyKey, any>, TConfigParams extends Record<AnyKey, any>>(
	cli: TCliParams,
	config: TConfigParams
): MergedRecords<TCliParams, TConfigParams> {
	const configKeys = new Set(Object.keys(config))
	const cliKeys = new Set(Object.keys(cli))

	const conflictKeys = [] as string[]

	for (const key of cliKeys) {
		if (configKeys.has(key)) conflictKeys.push(key)
	}

	if (conflictKeys.length) {
		const errMsgFields = conflictKeys.join(', ')

		throw new Error(`Following parameters have been provided both in CLI and config: ${errMsgFields}.`)
	}

	return { ...cli, ...config }
}

export function parseParams<
	TCliParams extends ValidatedCliSchemas,
	TUnionSchemas extends ObjectSchema[],
	TIntersectionSchema extends ObjectSchema
>(
	cliSchemas: TCliParams,
	configLoader: ConfigLoader<ExtractCliParamsOutput<TCliParams>> = () => ({}),
	schemas: { unions: TUnionSchemas; intersect: TIntersectionSchema }
): Intersect<SchemaOutput<TUnionSchemas>, SchemaOutput<TIntersectionSchema>> {
	const parsedCli = parseCliParams(cliSchemas)
	const config = configLoader(parsedCli)

	const merged = mergeWithoutOverrides(parsedCli, config)

	parseObjectMultiSchema(merged, schemas.unions, schemas.intersect)

	return merged as any
}
