import type {
	CliSchema,
	CliSchemaName,
	BuildCliSchemaSchemaFromString,
	CliSchemaValueType,
	CliSchemas,
	CommonCliSchemaDuplicateErrorStorage,
	CommonCliSchemaSingleAlias,
	CommonCliSchemaTypeErrorStorage,
	CommonExtractedCliSchemas,
	ExtractCliValueType,
	ExtractedCliSchemas,
	TrimDashes,
	ValidatedCliSchemas,
	CliSchemaStringTemplate
} from './types'

const startDashesRegExp = new RegExp(/^-*/)

export function trimDashes<T extends string>(from: T) {
	return from.replace(startDashesRegExp, '') as TrimDashes<T>
}

export function validateCliSchemaCollection<TCliSchemas extends CliSchemas>(
	schemaCollection: TCliSchemas
): asserts schemaCollection is ValidatedCliSchemas<TCliSchemas> {
	const knownAliases = new Set<string>()
	const knownViolations = new Set<string>()

	for (const param of schemaCollection) {
		const aliases = [param.name, ...(param.aliases ?? [])]

		for (const alias of aliases) {
			if (knownAliases.has(alias)) {
				knownViolations.add(alias)
			} else {
				knownAliases.add(alias)
			}
		}
	}

	const knownViolationsArr = Object.keys(knownViolations)
	if (knownViolationsArr.length) {
		let message = `Invalid CLI parameter schemas: duplicate aliases: ${knownViolationsArr.shift()}`

		knownViolationsArr.reduce((p, e) => p + `, ${e}`, message)

		message += '.\n'

		throw new Error(message)
	}
}

/**
 * @deprecated Requested for deletion
 */
export function buildCliSchemaFromTemplate<
	TTemplate extends CliSchemaStringTemplate,
	TResult = BuildCliSchemaSchemaFromString<TTemplate>[]
>(presets: TTemplate[]): TResult extends any[] ? ValidatedCliSchemas<TResult> : never {
	const result: CliSchema[] = []

	for (const preset of presets) {
		const [aliasZone, typeZone] = preset.split(' ')

		const aliases = aliasZone.split('').filter((alias) => !!alias) as [CliSchemaName, ...CliSchemaName[]]
		const name = aliases.shift()!

		const isRequired = typeZone.startsWith('!')
		const type = typeZone.slice(1) as CliSchemaValueType

		if (aliases.length) {
			result.push({
				name,
				aliases,
				type,
				isRequired
			})
		} else {
			result.push({
				name,
				type,
				isRequired
			})
		}
	}

	validateCliSchemaCollection(result)

	return result as any
}

export function parseCliParams<TCliSchemas extends ValidatedCliSchemas>(
	schemas: TCliSchemas
): ExtractedCliSchemas<TCliSchemas> {
	let procargs = JSON.parse(JSON.stringify(process.argv)) as string[]

	const sortedByOccurence: CommonCliSchemaSingleAlias[] = []
	for (let i = 0; i < procargs.length; ++i) {
		const arg = procargs[i]
		for (const schema of schemas) {
			const aliases = [schema.name, ...(schema.aliases ?? [])]
			const { name, type, isRequired } = schema

			for (const alias of aliases) {
				if (arg === alias) {
					sortedByOccurence.push({
						name,
						alias,
						type,
						isRequired
					})

					//Skip the next element as it will be read as an argument
					if (type !== 'boolean') ++i
				}
			}
		}
	}

	for (const schema of schemas) {
		const aliases = [schema.name, ...(schema.aliases ?? [])]
		const { name, type, isRequired } = schema

		for (const alias of aliases) {
			if (!sortedByOccurence.find((e) => e.alias === alias)) {
				sortedByOccurence.push({
					name,
					alias,
					type,
					isRequired
				})
			}
		}
	}

	const duplicateErrors: CommonCliSchemaDuplicateErrorStorage = {}
	const typeErrors: CommonCliSchemaTypeErrorStorage = {}

	const resultMap: CommonExtractedCliSchemas = {}

	for (const schema of sortedByOccurence) {
		const { alias, type, name } = schema

		const idx = procargs.findIndex((e) => e === alias)

		if (idx == -1) continue

		let value: ExtractCliValueType<(typeof schema)['type']> | undefined

		switch (type) {
			case 'boolean': {
				value = true

				procargs.splice(idx, 1)

				break
			}

			case 'number': {
				const valueArg = procargs[idx + 1]
				value = Number(valueArg)

				if (type === 'number' && Number.isNaN(value)) {
					typeErrors[alias] = {
						expected: type,
						receivedValue: valueArg
					}
				}

				procargs.splice(idx, 2)
				break
			}

			case 'string': {
				const valueArg = procargs[idx + 1]
				value = valueArg

				if (typeof valueArg !== 'string') {
					typeErrors[alias] = {
						expected: type,
						receivedValue: valueArg
					}
				}

				procargs.splice(idx, 2)
				break
			}
		}

		const trimmedName = trimDashes(name)
		resultMap[trimmedName] = value

		if (duplicateErrors[name]) {
			duplicateErrors[name]!.push(alias)
		} else {
			duplicateErrors[name] = [alias]
		}
	}

	for (const [key, value] of Object.entries(duplicateErrors)) {
		if (value && value.length < 2) delete duplicateErrors[key]
	}

	let errorMessage: string | undefined

	const duplicateErrorsArr = Object.entries(duplicateErrors)
	if (duplicateErrors.length) {
		errorMessage = errorMessage ?? ''

		for (const [name, duplicates] of duplicateErrorsArr) {
			if (!duplicates) continue

			let message = duplicates.reduce(
				(p, e) => p + `, ${e}`,
				`CLI duplicate param error: found multiple instances of param ${name}: ${duplicates.shift()}`
			)
			message += '.\n'

			errorMessage += message
		}
	}

	const typeErrorsArr = Object.entries(typeErrors)
	if (typeErrorsArr.length) {
		errorMessage = errorMessage ?? ''

		const message = typeErrorsArr.reduce(
			(p, e) =>
				p +
				`CLI param type error: invalid type on param ${e[0]}: expected ${e[1]?.expected}, received ${e[1]?.receivedValue}.\n`,
			''
		)

		errorMessage += message
	}

	const resultKeys = new Set(Object.keys(resultMap))
	const missingParams: string[] = []
	for (const schema of schemas) {
		const { name, isRequired } = schema
		if (!isRequired) continue

		const trimmedName = trimDashes(name)
		if (!resultKeys.has(trimmedName)) {
			missingParams.push(name)
		}
	}

	if (missingParams.length) {
		errorMessage =
			(errorMessage ?? '') +
			`CLI param type error: following required parameters are missing: ${missingParams.join(', ')}.`
	}

	if (errorMessage) throw new Error(errorMessage)

	return resultMap as any
}

export * from './types'
