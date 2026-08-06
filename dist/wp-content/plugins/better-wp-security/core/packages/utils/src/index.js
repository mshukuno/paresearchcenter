/**
 * External dependencies
 */
import { cloneDeep, get, isPlainObject, pick } from 'lodash';
import Ajv from 'ajv';
import { customizeValidator } from '@rjsf/validator-ajv8';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { addQueryArgs, getQueryArgs, removeQueryArgs } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WPError from './wp-error';
import ErrorResponse from './error-response';
import getParamHistory from './param-history';

export { WPError, getParamHistory };
export Result from './result';

export const GlobalNavigationContext = createContext( {
	getUrl( page, path ) {
		page = page === 'settings' ? 'itsec' : 'itsec-' + page;
		const href = removeQueryArgs(
			document.location.href,
			...Object.keys( getQueryArgs( document.location.href ) )
		);

		return addQueryArgs( href, path ? { page, path } : { page } );
	},
} );

export function useGlobalNavigationUrl( page, path ) {
	const { getUrl } = useContext( GlobalNavigationContext );

	return getUrl( page, path );
}

export function makeUrlRelative( baseUrl, target ) {
	let rel = target.replace( baseUrl, '' );

	if ( rel.charAt( 0 ) !== '/' ) {
		rel = '/' + rel;
	}

	return rel;
}

export function shortenNumber( number ) {
	if ( number <= 999 ) {
		return number.toString();
	}

	if ( number <= 9999 ) {
		const dec = number / 1000,
			fixed = dec.toFixed( 1 );

		if ( fixed.charAt( fixed.length - 1 ) === '0' ) {
			return fixed.replace( '.0', 'k' );
		}

		return `${ fixed }k`;
	}

	if ( number <= 99999 ) {
		return number.toString().substring( 0, 2 ) + 'k';
	}

	if ( number <= 999999 ) {
		return number.toString().substring( 0, 3 ) + 'k';
	}

	if ( number <= 9999999 ) {
		const dec = number / 1000000,
			fixed = dec.toFixed( 1 );

		if ( fixed.charAt( fixed.length - 1 ) === '0' ) {
			return fixed.replace( '.0', 'm' );
		}

		return `${ fixed }m`;
	}

	if ( number <= 99999999 ) {
		return number.toString().substring( 0, 2 ) + 'm';
	}

	if ( number <= 999999999 ) {
		return number.toString().substring( 0, 3 ) + 'm';
	}

	if ( number <= 9999999999 ) {
		const dec = number / 1000000000,
			fixed = dec.toFixed( 1 );

		if ( fixed.charAt( fixed.length - 1 ) === '0' ) {
			return fixed.replace( '.0', 'b' );
		}

		return `${ fixed }b`;
	}

	return number;
}

/**
 * Is the given value likely a WP Error object.
 *
 * @param {*} object
 * @return {boolean} Whether it was an error.
 */
export function isWPError( object ) {
	if ( ! isPlainObject( object ) ) {
		return false;
	}

	const keys = Object.keys( object );

	if ( keys.length !== 2 ) {
		return false;
	}

	return keys.includes( 'errors' ) && keys.includes( 'error_data' );
}

export function isApiError( object ) {
	if ( ! isPlainObject( object ) ) {
		return false;
	}

	const keys = Object.keys( object );

	if ( keys.length !== 3 && keys.length !== 4 ) {
		return false;
	}

	if ( keys.length === 4 && ! keys.includes( 'additional_errors' ) ) {
		return false;
	}

	return (
		keys.includes( 'code' ) &&
		keys.includes( 'message' ) &&
		keys.includes( 'data' )
	);
}

/**
 * Cast to a WPError instance.
 *
 * @param {*} object
 * @return {WPError} WPError instance.
 */
export function castWPError( object ) {
	if ( object instanceof WPError ) {
		return object;
	}

	if ( isWPError( object ) ) {
		return WPError.fromPHPObject( object );
	}

	if ( isApiError( object ) ) {
		return WPError.fromApiError( object );
	}

	return new WPError();
}

/**
 * Convert an entries iterator to an object.
 *
 * @param {Iterable} entries
 *
 * @return {Object} Object with entry[0] as the key and entry[1] as the value.
 */
export function entriesToObject( entries ) {
	const obj = {};

	for ( const [ key, val ] of entries ) {
		obj[ key ] = val;
	}

	return obj;
}

/**
 * Splits a list into two arrays, with items that pass the filter in the first array, and ones that fail in the second.
 *
 * @param {Array}    array
 * @param {Function} filter
 * @return {Array<Array>} Split array.
 */
export function bifurcate( array, filter ) {
	const bifurcated = [ [], [] ];

	for ( const value of array ) {
		bifurcated[ filter( value ) ? 0 : 1 ].push( value );
	}

	return bifurcated;
}

/**
 * Convert a response object from @wordpress/apiFetch to an Error object.
 *
 * @param {Object} response
 */
export function responseToError( response ) {
	if ( response instanceof Error ) {
		throw response;
	}

	throw new ErrorResponse( response );
}

export const MYSTERY_MAN_AVATAR =
	'https://secure.gravatar.com/avatar/d7a973c7dab26985da5f961be7b74480?s=96&d=mm&f=y&r=g';

/**
 * Gets a targetHint from an object.
 *
 * @param {Object}  object
 * @param {string}  header
 * @param {boolean} undefinedIfEmpty
 * @return {Array<string>|undefined} The target hint value.
 */
export function getTargetHint( object, header, undefinedIfEmpty = true ) {
	return get(
		object,
		[ '_links', 'self', 0, 'targetHints', header ],
		undefinedIfEmpty ? undefined : []
	);
}

/**
 * Get the "self" link for a REST API object.
 *
 * @param {Object} object
 * @return {string|undefined} The self link.
 */
export function getSelf( object ) {
	return getLink( object, 'self' );
}

/**
 * Converts a REST API URL to a REST PATH.
 *
 * This only works for ithemes-security routes.
 *
 * @param {string} url The full REST API url.
 * @return {string|undefined} The path, or undefined if unavailable.
 */
export function restUrlToPath( url ) {
	// https://security.test/wp-json/ithemes-security/v1/trusted-devices/1/d04c1b80-eaf6-4f2a-811e-d1309c725194

	const index = url.indexOf( '/ithemes-security/' );

	if ( index === -1 ) {
		return undefined;
	}

	return url.substring( index );
}

/**
 * Get the href for a link with the given relation.
 *
 * @param {Object} object
 * @param {string} rel
 * @return {string|undefined} The link.
 */
export function getLink( object, rel ) {
	return get( object, [ '_links', rel, 0, 'href' ] );
}

/**
 * Get a link from a schema document.
 *
 * @param {Object} schema
 * @param {string} rel
 *
 * @return {Object|undefined} The schema link.
 */
export function getSchemaLink( schema, rel ) {
	if ( ! schema || ! schema.links ) {
		return;
	}

	for ( const link of schema.links ) {
		if ( link.rel === rel ) {
			return link;
		}
	}
}

/**
 * Modifies a schema by its ui schema.
 *
 * This will remove any hidden fields from the actual schema document.
 *
 * @param {Object} schema
 * @param {Object} uiSchema
 * @return {Object} The modified schema.
 */
export function modifySchemaByUiSchema( schema, uiSchema ) {
	if ( schema.type !== 'object' ) {
		return schema;
	}

	let modified;

	for ( const property in uiSchema ) {
		if ( ! uiSchema.hasOwnProperty( property ) ) {
			continue;
		}

		if ( uiSchema[ property ][ 'ui:widget' ] === 'hidden' ) {
			if ( ! modified ) {
				modified = cloneDeep( schema );
			}

			delete modified.properties[ property ];
		}
	}

	return modified || schema;
}

/**
 * Transform an API error to a list of messages.
 *
 * @param {Object} error
 * @return {string[]} The list of error messages.
 */
export function transformApiErrorToList( error ) {
	let messages = [];

	if ( ! error ) {
		return messages;
	}

	const wpError =
		error instanceof WPError
			? error
			: castWPError( pick( error, [ 'code', 'message', 'data' ] ) );

	if ( wpError.getErrorCode() === 'rest_invalid_param' ) {
		messages = Object.values( wpError.getErrorData().params );
	}

	return [ ...wpError.getAllErrorMessages(), ...messages ];
}

/**
 * Time Since date occured
 *
 * @param {Date} date The date to compare against.
 * @return {string} The time since the date occurred.
 */
export function timeSince( date ) {
	const currentDate = new Date();
	if ( date > currentDate ) {
		return __( 'Online Recently', 'better-wp-security' );
	}
	const seconds = Math.floor( ( currentDate - date ) / 1000 );

	let interval = seconds / 31536000;

	if ( interval > 1 ) {
		return sprintf(
			/* translators: 1. number of years since */
			__( '%s years', 'better-wp-security' ),
			Math.floor( interval )
		);
	}
	interval = seconds / 2592000;
	if ( interval > 1 ) {
		return sprintf(
			/* translators: 1. number of months since */
			__( '%s months', 'better-wp-security' ),
			Math.floor( interval )
		);
	}
	interval = seconds / 86400;
	if ( interval > 1 ) {
		return sprintf(
			/* translators: 1. number of days since */
			__( '%s days', 'better-wp-security' ),
			Math.floor( interval )
		);
	}
	interval = seconds / 3600;
	if ( interval > 1 ) {
		return sprintf(
			/* translators: 1. number of hours since */
			__( '%s hours', 'better-wp-security' ),
			Math.floor( interval )
		);
	}
	interval = seconds / 60;
	if ( interval > 1 ) {
		return sprintf(
			/* translators: 1. number of minutes since */
			__( '%s minutes', 'better-wp-security' ),
			Math.floor( interval )
		);
	}
	return sprintf(
		/* translators: 1. number of seconds since */
		__( '%s seconds', 'better-wp-security' ),
		Math.floor( interval )
	);
}

/**
 * Validates whether a string is a valid email address.
 *
 * THis matches the logic from WordPress's is_email() function.
 *
 * @param {string} email The email address to validate.
 * @return {string|false} Returns the email address if valid, false otherwise.
 */
export function isEmail( email ) {
	if ( ! email || typeof email !== 'string' ) {
		return false;
	}

	// Test for the minimum length the email can be.
	if ( email.length < 6 ) {
		return false;
	}

	// Test for an @ character after the first position.
	const atIndex = email.indexOf( '@', 1 );
	if ( atIndex === -1 ) {
		return false;
	}

	// Split out the local and domain parts.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const [ local, domain ] = email.split( '@' );

	// LOCAL PART
	// Test for invalid characters.
	if ( ! /^[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~\.-]+$/.test( local ) ) {
		return false;
	}

	// DOMAIN PART
	// Test for sequences of periods.
	if ( /\.{2,}/.test( domain ) ) {
		return false;
	}

	// Test for leading and trailing periods and whitespace.
	if ( domain.trim().replace( /^\.|\.$/g, '' ) !== domain ) {
		return false;
	}

	// Split the domain into subs.
	const subs = domain.split( '.' );

	// Assume the domain will have at least two subs.
	if ( subs.length < 2 ) {
		return false;
	}

	// Loop through each sub.
	for ( const sub of subs ) {
		// Test for leading and trailing hyphens and whitespace.
		if ( sub.trim().replace( /^-|-$/g, '' ) !== sub ) {
			return false;
		}

		// Test for invalid characters.
		if ( ! /^[a-z0-9-]+$/i.test( sub ) ) {
			return false;
		}
	}

	// Congratulations, your email made it!
	return email;
}

const customFormats = {
	html: {
		type: 'string',
		validate() {
			// Validating HTML isn't something we can realistically do.
			// We accept everything and can then kses it on the server.
			return true;
		},
	},
	'relative-file-path': {
		type: 'string',
		validate( value ) {
			if ( value.includes( '../' ) ) {
				return false;
			}

			return true;
		},
	},
	'file-path': {
		type: 'string',
		validate( value ) {
			if ( ! value.startsWith( '/' ) ) {
				return false;
			}

			if ( value.includes( '../' ) ) {
				return false;
			}

			return true;
		},
	},
	directory: {
		type: 'string',
		validate( value ) {
			if ( ! value.startsWith( '/' ) ) {
				return false;
			}

			if ( value.includes( '../' ) ) {
				return false;
			}

			return true;
		},
	},
	email: {
		type: 'string',
		validate( value ) {
			return isEmail( value );
		},
	},
};

/**
 * Grabs a global instance of Ajv. It's used for validation settings on saving
 * with data store.
 *
 * @return {Ajv.Ajv} The ajv instance.
 */
export function getAjv() {
	if ( ! getAjv.instance ) {
		getAjv.instance = new Ajv( { strict: false, formats: customFormats } );
	}

	return getAjv.instance;
}

/**
 * Grabs a global instance of RJSF validator. It's required for creating RJSF forms
 * and used by RJSF internally.
 */
export function getRjsfValidator() {
	if ( ! getRjsfValidator.instance ) {
		getRjsfValidator.instance = customizeValidator( { customFormats, ajvOptionsOverrides: { strict: false } } );
	}

	return getRjsfValidator.instance;
}

/**
 * Gets an emoji for the given country code.
 *
 * @param {string} countryCode The two-letter country code.
 * @return {string} The unicode emoji characters.
 */
export function getFlagEmoji( countryCode ) {
	if ( ! countryCode ) {
		return '';
	}

	// https://dev.to/jorik/country-code-to-flag-emoji-a21
	const codePoints = countryCode
		.toUpperCase()
		.split( '' )
		.map( ( char ) => 127397 + char.charCodeAt() );
	return String.fromCodePoint( ...codePoints );
}
