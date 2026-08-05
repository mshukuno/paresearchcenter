/**
 * External dependencies
 */
import { isObject, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import * as templates from './templates';
import * as widgets from './widgets';
import * as fields from './fields';
import { getRjsfValidator } from '@ithemes/security-utils';

const theme = {
	templates,
	widgets,
	fields,
	validator: getRjsfValidator(),
};

export default theme;

export { RjsfFieldFill } from './slot-fill';

export function mapApiError( error ) {
	if (
		error.code === 'rest_invalid_param' &&
		isObject( error.data.params )
	) {
		return mapValues( error.data.params, ( pError ) => ( {
			__errors: [ pError ],
		} ) );
	}

	return {
		__errors: [ error.message ],
	};
}
