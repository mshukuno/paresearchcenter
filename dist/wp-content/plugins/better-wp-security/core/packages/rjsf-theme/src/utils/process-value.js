/**
 * External dependencies
 */
import { asNumber, guessType } from '@rjsf/utils';

const nums = new Set( [ 'number', 'integer' ] );

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 *
 * @param {Object} schema
 * @param {string} schema.type
 * @param {Array}  schema.enum
 * @param {*}      value
 *
 * @return {*} The processed value.
 */
export function processValue( schema, value ) {
	// "enum" is a reserved word, so only "type" and "items" can be destructured
	const { type, items } = schema;
	const enumValues = normalizeEnumValues( schema );
	if ( enumValues.includes( value ) ) {
		return value;
	}

	if ( value === '' ) {
		return undefined;
	} else if ( type === 'array' && items && nums.has( items.type ) ) {
		return value.map( asNumber );
	} else if ( type === 'boolean' ) {
		return value === 'true';
	} else if ( type === 'number' || type === 'integer' ) {
		return asNumber( value );
	}

	// If type is undefined, but an enum is present, try and infer the type from
	// the enum values
	if ( enumValues.length > 0 ) {
		if ( enumValues.every( ( x ) => guessType( x ) === 'number' ) ) {
			return asNumber( value );
		} else if (
			enumValues.every( ( x ) => guessType( x ) === 'boolean' )
		) {
			return value === 'true';
		}
	}

	return value;
}

/**
 * Normalizes and extracts enum values from a provided schema.
 *
 * @param {Object} schema The schema object to extract enum values from. It may contain an `enum` property or a `oneOf` property
 *                        which holds options each containing a single-value `enum` array.
 * @return {Array} An array of normalized enum values extracted from the schema.
 * Returns an empty array if no enums are found or valid.
 */
function normalizeEnumValues( schema ) {
	if ( schema.enum ) {
		return schema.enum;
	}

	if ( schema.oneOf && schema.oneOf.every( ( option ) => option.enum && option.enum.length === 1 ) ) {
		return schema.oneOf.map( ( option ) => option.enum[ 0 ] );
	}

	return [];
}
