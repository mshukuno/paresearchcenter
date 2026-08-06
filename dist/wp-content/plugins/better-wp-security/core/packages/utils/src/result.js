import { castWPError } from './';

export default class Result {
	type;
	error;
	data;
	success;
	info;
	warning;

	constructor(
		type,
		error,
		data = null,
		success = [],
		info = [],
		warning = []
	) {
		this.type = type;
		this.error = error;
		this.data = data;
		this.success = success;
		this.info = info;
		this.warning = warning;

		Object.seal( this );
	}

	isSuccess() {
		return this.type === Result.SUCCESS;
	}

	/**
	 * Creates a Result object from an API response.
	 *
	 * @param {Response} response Response object.
	 * @return {Result} The result.
	 */
	static async fromResponse( response ) {
		const getMessages = ( type ) => {
			const header = response.headers?.get( `X-Messages-${ type }` );

			return header ? JSON.parse( header ) : [];
		};

		const json =
			response.status !== 204 && response.json
				? await response.json()
				: null;
		const error = castWPError( json );
		const type = error.hasErrors() ? Result.ERROR : Result.SUCCESS;
		const success = getMessages( 'Success' );
		const info = getMessages( 'Info' );
		const warning = getMessages( 'Warning' );

		return new Result( type, error, json, success, info, warning );
	}

	/**
	 * @typedef {Object} response
	 * @property {Object} body    Body of the response.
	 * @property {Object} headers Headers of the response.
	 * @property {number} status  Status code of the response.
	 */

	/**
	 * @param {response} response Response object.
	 * @return {Result} Result instance.
	 */
	static fromResponseObject( { body, headers } ) {
		const getMessages = ( type ) => {
			const header = headers?.[ `X-Messages-${ type }` ];

			return header ? JSON.parse( header ) : [];
		};

		const error = castWPError( body );
		const type = error.hasErrors() ? Result.ERROR : Result.SUCCESS;
		const success = getMessages( 'Success' );
		const info = getMessages( 'Info' );
		const warning = getMessages( 'Warning' );
		return new Result( type, error, body, success, info, warning );
	}

	/**
	 * @param {Object } error Error object.
	 * @return {Result} Result instance.
	 */
	static fromError( error ) {
		return new Result( Result.ERROR, castWPError( error ) );
	}
}

Object.defineProperty( Result, 'SUCCESS', {
	value: 'success',
	writable: false,
	enumerable: false,
	configurable: false,
} );

Object.defineProperty( Result, 'ERROR', {
	value: 'error',
	writable: false,
	enumerable: false,
	configurable: false,
} );
