/**
 * External dependencies
 */
import { map } from 'lodash';
import { getUiOptions } from '@rjsf/utils';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useMemo, useState, useEffect, useCallback } from '@wordpress/element';
import { BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { AsyncSelect } from '@ithemes/security-ui';
import { Markup } from '@ithemes/security-components';

function formatOption( key, label ) {
	return { value: key, label };
}

/**
 * A generic multi-select field for selecting items from a REST API endpoint.
 * The API should return an object with keys as values and labels as values: { "key": "Label", ... }
 *
 * Usage in module.json:
 * ```
 * "uiSchema": {
 *   "my_field": {
 *     "ui:field": "ApiSelectField",
 *     "ui:options": {
 *       "path": "/my-namespace/v1/items",
 *       "placeholder": "Select items..."
 *     }
 *   }
 * }
 * ```
 * @param {Object}   root0            The component props.
 * @param {Object}   root0.uiSchema   The UI schema object.
 * @param {Object}   root0.schema     The schema object.
 * @param {Object}   root0.idSchema   The ID schema object.
 * @param {string}   root0.name       The field name.
 * @param {any}      root0.formData   The current field value.
 * @param {boolean}  root0.disabled   Whether the field is disabled.
 * @param {boolean}  root0."readonly" Whether the field is read-only.
 * @param {Function} root0.onChange   Function to call when value changes.
 */
export default function ApiSelectField( {
	uiSchema,
	schema,
	idSchema,
	name,
	formData,
	disabled,
	readonly,
	onChange,
} ) {
	const options = getUiOptions( uiSchema );
	const { path, placeholder } = options;
	const [ optionsCache, setOptionsCache ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( true );
	const isMulti = schema.type === 'array';

	// Load all options on mount.
	useEffect( () => {
		if ( ! path ) {
			setIsLoading( false );
			return;
		}

		apiFetch( { path } )
			.then( ( response ) => {
				setOptionsCache( response );
			} )
			.finally( () => setIsLoading( false ) );
	}, [ path ] );

	// Filter options based on search.
	const loadOptions = useCallback(
		( search ) =>
			new Promise( ( resolve ) => {
				if ( ! optionsCache ) {
					resolve( [] );
					return;
				}

				const filtered = Object.entries( optionsCache )
					.filter( ( [ , label ] ) =>
						label.toLowerCase().includes( search.toLowerCase() )
					)
					.map( ( [ key, label ] ) => formatOption( key, label ) );
				resolve( filtered );
			} ),
		[ optionsCache ]
	);

	// Convert stored values to select format.
	const values = useMemo( () => {
		if ( ! optionsCache ) {
			return isMulti ? [] : null;
		}

		if ( isMulti ) {
			if ( ! formData ) {
				return [];
			}
			return formData
				.filter( ( key ) => optionsCache[ key ] )
				.map( ( key ) => formatOption( key, optionsCache[ key ] ) );
		}

		// Single select.
		if ( ! formData || ! optionsCache[ formData ] ) {
			return null;
		}

		return formatOption( formData, optionsCache[ formData ] );
	}, [ formData, optionsCache, isMulti ] );

	// All options for default dropdown.
	const defaultOptions = useMemo( () => {
		// Show loading.
		if ( ! optionsCache ) {
			return true;
		}
		return Object.entries( optionsCache ).map( ( [ key, label ] ) =>
			formatOption( key, label )
		);
	}, [ optionsCache ] );

	const handleChange = ( selected ) => {
		if ( isMulti ) {
			onChange( map( selected || [], 'value' ) );
		} else {
			onChange( selected?.value || '' );
		}
	};

	const description = uiSchema?.[ 'ui:description' ] || schema.description;
	const label = uiSchema?.[ 'ui:title' ] || schema.title || name;

	return (
		<BaseControl
			className="itsec-api-select-field"
			label={ label }
			help={ description && <Markup noWrap content={ description } /> }
			id={ idSchema.$id }
		>
			<AsyncSelect
				inputId={ idSchema.$id }
				classNamePrefix="components-itsec-async-select-control"
				isDisabled={ disabled || readonly }
				isLoading={ isLoading }
				isMulti={ isMulti }
				isClearable
				cacheOptions
				defaultOptions={ defaultOptions }
				loadOptions={ loadOptions }
				value={ values }
				onChange={ handleChange }
				placeholder={ placeholder || __( 'Select…', 'better-wp-security' ) }
			/>
		</BaseControl>
	);
}
