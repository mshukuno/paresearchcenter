/**
 * WordPress dependencies
 */
import { RadioControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Markup } from '@ithemes/security-components';
import { processValue } from '../../utils';

export default function RadioWidget( {
	schema,
	uiSchema = {},
	id,
	options,
	value,
	label,
	required,
	disabled,
	readonly,
	onChange,
	onBlur,
	onFocus,
} ) {
	const { enumOptions } = options;
	const description = uiSchema[ 'ui:description' ] || schema.description;

	return (
		<RadioControl
			selected={ value }
			options={ enumOptions }
			label={ label }
			help={ <Markup noWrap content={ description } /> }
			required={ required }
			disabled={ disabled }
			readOnly={ readonly }
			onChange={ ( newValue ) =>
				onChange( processValue( schema, newValue ) )
			}
			onBlur={
				onBlur &&
				( ( e ) =>
					onBlur( id, processValue( schema, e.target.value ) ) )
			}
			onFocus={
				onFocus &&
				( ( e ) =>
					onFocus( id, processValue( schema, e.target.value ) ) )
			}
		/>
	);
}
