export type TypeDefinitionTypes = 'string' | 'number' | 'boolean' | 'literal'

export type LiteralType = string | number | boolean

export type TypeDefinition<TTypeDef extends TypeDefinitionTypes = TypeDefinitionTypes> = TTypeDef extends
	| 'string'
	| 'number'
	| 'boolean'
	? {
			type: TTypeDef
			isOptional: boolean
	  }
	: TTypeDef extends 'literal'
	? {
			type: TTypeDef
			values: [LiteralType, ...LiteralType[]]
			isOptional: boolean
	  }
	: never

export type ObjectSchema<TKey extends AnyKey = AnyKey, TFieldDefinition extends TypeDefinition = TypeDefinition> = {
	[Key in TKey]: TFieldDefinition
}

export type SchemaUnion<TSchemas extends ObjectSchema[]> = TSchemas[number]

export type SchemaIntersection<TFirst extends ObjectSchema, TSecond extends ObjectSchema> = {
	[K in keyof TFirst | keyof TSecond]: TFirst[K] extends {} ? TFirst[K] : TSecond[K]
}

export type ExtractTypeFromDefinition<TDefinition extends TypeDefinition> = TDefinition['isOptional'] extends false
	? TDefinition['type'] extends 'string'
		? string
		: TDefinition['type'] extends 'number'
		? number
		: TDefinition['type'] extends 'boolean'
		? boolean
		: TDefinition extends {
				type: 'literal'
				values: infer R extends [LiteralType, ...LiteralType[]]
		  }
		? R[number]
		: never
	: TDefinition['type'] extends 'string'
	? string | undefined
	: TDefinition['type'] extends 'number'
	? number | undefined
	: TDefinition['type'] extends 'boolean'
	? boolean | undefined
	: TDefinition extends {
			type: 'literal'
			values: infer R extends [LiteralType, ...LiteralType[]]
	  }
	? R[number] | undefined
	: never

export type ObjectToUnion<TObj extends Record<AnyKey, any>> = {
	[K in keyof TObj]: {
		key: K
	} & TObj[K]
}[keyof TObj]

export type SchemaOutput<TSchema extends ObjectSchema | ObjectSchema[]> = TSchema extends ObjectSchema
	? {
			[K in Extract<
				ObjectToUnion<TSchema>,
				{ key: string; isOptional: true }
			> as K['key']]?: ExtractTypeFromDefinition<TSchema[K['key']]>
	  } & {
			[K in Extract<
				ObjectToUnion<TSchema>,
				{ key: string; isOptional: false }
			> as K['key']]: ExtractTypeFromDefinition<TSchema[K['key']]>
	  }
	: TSchema extends Array<infer Schema extends ObjectSchema>
	? SchemaOutput<Schema>
	: never

/**
 * @deprecated
 */
export type OldSchemaOutput<TSchema extends ObjectSchema | ObjectSchema[]> = TSchema extends ObjectSchema
	? {
			[K in keyof TSchema]: ExtractTypeFromDefinition<TSchema[K]>
	  }
	: TSchema extends Array<infer Schema extends ObjectSchema>
	? OldSchemaOutput<Schema>
	: never

export type ParsingError = string

export type ParseObjectOutput<TSchema extends ObjectSchema> =
	| {
			success: true
			object: SchemaOutput<TSchema>
	  }
	| {
			success: false
			errors: ParsingError[]
	  }

export type SchemaDescription = {
	key: string
	expected: 'string' | 'number' | 'boolean' | LiteralType[]
	isOptional: boolean
}

export type Intersect<TFirst extends {}, TSecond extends {}> = TSecond & {
	[K in keyof TFirst as K extends keyof TSecond ? never : K]: TFirst[K]
}
