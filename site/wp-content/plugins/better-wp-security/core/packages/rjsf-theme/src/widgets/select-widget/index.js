/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Markup } from '@ithemes/security-components';
import { processValue } from '../../utils';

function getValue( event, multiple ) {
	if ( multiple ) {
		return [].slice
			.call( event.target.options )
			.filter( ( o ) => o.selected )
			.map( ( o ) => o.value );
	}
	return event.target.value;
}

function SelectWidget( props ) {
	const {
		schema,
		uiSchema = {},
		id,
		options,
		value,
		label,
		required,
		disabled,
		readonly,
		multiple,
		onChange,
		onBlur,
		onFocus,
		placeholder,
	} = props;
	const { enumOptions, enumDisabled } = options;
	const emptyValue = multiple ? [] : '';

	const optionsList = [];

	if ( ! multiple && schema.default === undefined ) {
		optionsList.push( { value: '', label: placeholder } );
	}

	for ( const option of enumOptions ) {
		optionsList.push( {
			...option,
			disabled: enumDisabled && enumDisabled.includes( option.value ),
		} );
	}

	const description = uiSchema[ 'ui:description' ] || schema.description;

	return (
		<SelectControl
			multiple={ multiple }
			options={ optionsList }
			value={ typeof value === 'undefined' ? emptyValue : value }
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
					onBlur(
						id,
						processValue( schema, getValue( e, multiple ) )
					) )
			}
			onFocus={
				onFocus &&
				( ( e ) =>
					onFocus(
						id,
						processValue( schema, getValue( e, multiple ) )
					) )
			}
		/>
	);
}

export default SelectWidget;
