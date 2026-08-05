/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useAsync from './use-async';
import { MODULES_STORE_NAME } from '@ithemes/security.packages.data';

/**
 * Hook to detect the current user's IP address.
 *
 * @param {string} [proxyProvided]       Override proxy setting.
 * @param {string} [proxyHeaderProvided] Override proxy header setting.
 * @return {{ip: string|undefined, label: string|undefined, detectIp: Function, status: string}} Hook info.
 */
export default function useDetectedIp( proxyProvided, proxyHeaderProvided ) {
	const { proxySetting, proxyHeaderSetting, schema } = useSelect( ( select ) => ( {
		proxySetting: select( MODULES_STORE_NAME ).getEditedSetting(
			'global',
			'proxy'
		),
		proxyHeaderSetting: select( MODULES_STORE_NAME ).getEditedSetting(
			'global',
			'proxy_header'
		),
		schema: select( MODULES_STORE_NAME ).getSettingSchema(
			'global',
			'proxy'
		),
	} ), [] );

	const proxy = proxyProvided || proxySetting;
	const proxyHeader = proxyHeaderProvided || proxyHeaderSetting;

	const execute = useCallback( () => {
		const enumValues = schema.oneOf.map( ( option ) => option.enum[ 0 ] );
		const data = {
			proxy: enumValues.includes( proxy ) ? proxy : schema.default,
		};

		if ( data.proxy === 'manual' ) {
			data.args = { header: proxyHeader };
		}

		return apiFetch( {
			method: 'POST',
			path: 'ithemes-security/rpc/global/detect-ip',
			data,
		} );
	}, [ proxy, proxyHeader, schema ] );

	const { execute: detectIp, status, value, error } = useAsync(
		execute,
		!! proxy && !! schema
	);

	let label;

	switch ( status ) {
		case 'idle':
			break;
		case 'pending':
			label = __( 'Detecting IP', 'better-wp-security' );
			break;
		case 'success':
			/* translators: 1. IP address. */
			label = sprintf( __( 'Detected IP: %s', 'better-wp-security' ), value.ip );
			break;
		case 'error':
			label = sprintf(
				/* translators: 1. Error message. */
				__( 'Error detecting IP: %s', 'better-wp-security' ),
				error.message || __( 'Unknown error.' )
			);
			break;
	}

	return {
		label,
		detectIp,
		ip: value?.ip,
		status,
	};
}
