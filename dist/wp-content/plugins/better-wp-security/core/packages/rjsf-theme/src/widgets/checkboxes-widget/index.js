/**
 * Internal dependencies
 */
import { CheckboxGroupControl, Markup } from '@ithemes/security-components';

export default function CheckboxesWidget( props ) {
	const {
		disabled,
		options,
		value,
		readonly,
		onChange,
		label,
		schema,
		uiSchema = {},
	} = props;
	const { enumOptions, enumDisabled = [], style } = options;

	const description = uiSchema[ 'ui:description' ] || schema.description;
	const optionList = enumOptions.map( ( option ) => ( {
		...option,
		disabled: enumDisabled.includes( option.value ),
		help: option.schema.description && (
			<Markup noWrap content={ option.schema.description } />
		),
	} ) );

	return (
		<CheckboxGroupControl
			value={ value || [] }
			onChange={ onChange }
			options={ optionList }
			label={ label || uiSchema[ 'ui:title' ] || schema.title }
			help={ <Markup noWrap content={ description } /> }
			readOnly={ readonly }
			disabled={ disabled }
			style={ style }
		/>
	);
}
