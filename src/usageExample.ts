// CLIPARAMSTEST
// import { parseCliParams, validateCliSchemaCollection, type CliSchemas } from 'cliParser'

// const paramsSchema = [
// 	{
// 		name: '--config',
// 		aliases: ['-c', '-cfg'],
// 		type: 'string',
// 		isRequired: true
// 	},
// 	{
// 		name: '--dialect',
// 		aliases: ['-d'],
// 		type: 'string',
// 		isRequired: false
// 	},
// 	{
// 		name: '--flag',
// 		aliases: ['-f'],
// 		type: 'boolean',
// 		isRequired: true
// 	}
// ] satisfies CliSchemas

// validateCliSchemaCollection(paramsSchema)

// const params = parseCliParams(paramsSchema)

// try {
// 	console.log(params)
// } catch (error) {
// 	console.error((<any>error).message)
// }

// import { CliSchemas, validateCliSchemaCollection } from 'cliParser'
// import { ObjectSchema } from 'schemaParser'
// import { parseParams } from 'paramsMerger'

// const cliSchema = [
// 	{
// 		name: '--config',
// 		aliases: ['-c'],
// 		type: 'string',
// 		isRequired: false
// 	},
// 	{
// 		name: '--schema',
// 		aliases: ['-s'],
// 		type: 'string',
// 		isRequired: false
// 	},
// 	{
// 		name: '--out',
// 		aliases: ['-o'],
// 		type: 'string',
// 		isRequired: false
// 	},
// 	{
// 		name: '--custom',
// 		type: 'boolean',
// 		isRequired: false
// 	}
// ] satisfies CliSchemas

// validateCliSchemaCollection(cliSchema)

// const unionObjects = [
// 	{
// 		config: {
// 			type: 'string',
// 			isOptional: true
// 		}
// 	},
// 	{
// 		schema: {
// 			type: 'string',
// 			isOptional: false
// 		},
// 		out: {
// 			type: 'string',
// 			isOptional: false
// 		}
// 	}
// ] as const satisfies ObjectSchema[]

// const intersectionObject = {
// 	custom: {
// 		type: 'boolean',
// 		isOptional: true
// 	}
// } as const satisfies ObjectSchema

// const loadConfig = () => ({
// 	custom: true
// })

// try {
// 	const params = parseParams(cliSchema, loadConfig, {
// 		unions: unionObjects,
// 		intersect: intersectionObject
// 	})

// 	console.log(params)
// } catch (e) {
// 	console.error((<any>e).message)
// }
