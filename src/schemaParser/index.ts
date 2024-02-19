import type {
	ExtractTypeFromDefinition,
	Intersect,
	ObjectSchema,
	ParseObjectOutput,
	ParsingError,
	SchemaDescription,
	SchemaOutput,
	TypeDefinition
} from './types'

export function parseValue<TTypeDef extends TypeDefinition>(
	value: any,
	typeDef: TTypeDef
): value is ExtractTypeFromDefinition<TTypeDef> {
	const { type, isOptional } = typeDef

	if (isOptional && value === undefined) {
		return true
	}

	switch (type) {
		case 'string':
		case 'boolean':
		case 'number':
			return typeof value === type

		case 'literal':
			return !!typeDef.values.find((val) => val === value)
	}
}

export function parseObject<TSchema extends ObjectSchema>(
	object: Record<any, any>,
	schema: ObjectSchema
): ParseObjectOutput<TSchema> {
	const errors: ParsingError[] = []

	let objectKVs = Object.entries(object)
	const objectKeys = new Set(Object.keys(object))
	const schemaKeys = new Set(Object.keys(schema))

	const unknownKeys: string[] = []
	for (const [key] of objectKVs) {
		if (!schemaKeys.has(key)) {
			errors.push(`Unrecognized key "${key}".`)

			unknownKeys.push(key)
		}
	}

	for (const key of schemaKeys) {
		if (!objectKeys.has(key) && !schema[key].isOptional) {
			errors.push(`Missing key "${key}".`)

			object[key] = undefined
		}
	}

	objectKVs = objectKVs.filter((e) => !unknownKeys.find((undef) => undef === e[0]))

	for (const [key, value] of objectKVs) {
		const currentSchema = schema[key]

		if (!parseValue(value, currentSchema)) {
			const { type } = currentSchema

			const [expected, received] =
				type === 'literal' ? [currentSchema.values.join(' | '), value] : [currentSchema.type, typeof value]

			errors.push(`Invalid value in key "${key}": expected ${expected}, received ${received}.`)
		}
	}

	if (errors.length) {
		return {
			success: false,
			errors
		}
	}

	return {
		success: true,
		object: object as any
	}
}

export function extractExpectedValue<TTypeDef extends TypeDefinition>(
	typeDef: TTypeDef
): ExtractTypeFromDefinition<TTypeDef> {
	const { type } = typeDef

	switch (type) {
		case 'string':
		case 'boolean':
		case 'number':
			return typeDef.type as any

		case 'literal':
			return typeDef.values as any
	}
}

export function parseObjectMultiSchema<TUnionSchemas extends ObjectSchema[], TIntersectionSchema extends ObjectSchema>(
	object: Record<any, any>,
	unions: TUnionSchemas,
	intersection: TIntersectionSchema
): asserts object is Intersect<SchemaOutput<TUnionSchemas>, SchemaOutput<TIntersectionSchema>> {
	let isSuccess = false

	const compliledSchemas: ObjectSchema[] = unions.map((e) => ({
		...e,
		...intersection
	}))

	for (const schema of compliledSchemas) {
		if (parseObject(object, schema).success) {
			isSuccess = true

			break
		}
	}

	if (!isSuccess) {
		const keySets: SchemaDescription[][] = []

		for (const schema of compliledSchemas) {
			const localKeySet: SchemaDescription[] = Object.entries(schema).map((e) => ({
				key: e[0],
				expected: extractExpectedValue(e[1]),
				isOptional: e[1].isOptional
			})) as any

			keySets.push(localKeySet)
		}

		let errMsg = `None of the following sets of keys have been matched:\n`

		let maxLen = 0
		const msgs: string[] = []

		for (const currentSet of keySets) {
			const localMsgs: string[] = []

			for (const { key, expected, isOptional } of currentSet) {
				const formatted =
					`${key}${isOptional ? '?' : ''}: ` +
					(typeof expected === 'string' ? expected : expected.join(' | '))

				localMsgs.push(formatted)
			}

			const currentRow = localMsgs.join(', ')
			maxLen = currentRow.length > maxLen ? currentRow.length : maxLen
			msgs.push(currentRow)
		}

		const msgBorder = '-'.repeat(maxLen)
		errMsg += msgBorder + '\n' + msgs.join(`\n${msgBorder}\n`) + '\n' + msgBorder + '\n'

		throw new Error(errMsg)
	}
}

export * from './types'
