/**
 * External dependencies
 */
import {
	canExpand,
	getTemplate,
	getUiOptions,
	titleId,
	descriptionId,
} from '@rjsf/utils';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Markup } from '@ithemes/security-components';

export default function ObjectFieldTemplate( props ) {
	const {
		schema,
		uiSchema,
		properties,
		registry,
		title,
		description,
		idSchema,
		required,
	} = props;

	if ( ! properties.length ) {
		return null;
	}

	const options = getUiOptions( uiSchema );
	const TitleFieldTemplate = getTemplate( 'TitleFieldTemplate', registry, options );
	const DescriptionFieldTemplate = getTemplate(
		'DescriptionFieldTemplate',
		registry,
		options
	);

	const sectionMap = ( uiSchema[ 'ui:sections' ] || [] ).reduce(
		( acc, val ) => ( {
			...acc,
			[ val.fields.find(
				( field ) => !! schema.properties[ field ]
			) ]: val,
		} ),
		{}
	);

	return (
		<div className="itsec-rjsf-object-fieldset" id={ idSchema.$id }>
			{ title && (
				<TitleFieldTemplate
					id={ titleId( idSchema ) }
					title={ title }
					required={ required }
					schema={ schema }
					uiSchema={ uiSchema }
					registry={ registry }
				/>
			) }
			{ description && (
				<DescriptionFieldTemplate
					id={ descriptionId( idSchema ) }
					description={ <Markup noWrap content={ props.description } /> }
					schema={ schema }
					uiSchema={ uiSchema }
					registry={ registry }
				/>
			) }
			{ properties.map( ( { name, content } ) => {
				if ( sectionMap[ name ] ) {
					return (
						<Fragment key={ name }>
							<h3 className="itsec-rjsf-section-title">
								{ sectionMap[ name ].title }
							</h3>
							{ sectionMap[ name ].description && (
								<p className="itsec-rjsf-section-description">
									<Markup
										noWrap
										content={
											sectionMap[ name ].description
										}
									/>
								</p>
							) }
							{ content }
						</Fragment>
					);
				}

				return content;
			} ) }
			{ canExpand( schema, uiSchema, props.formData ) && (
				<AddButton
					className="object-property-expand"
					onClick={ props.onAddClick( schema ) }
					disabled={ props.disabled || props.readonly }
				/>
			) }
		</div>
	);
}

function AddButton( { className, onClick, disabled } ) {
	return (
		<div className="row">
			<p
				className={ `col-xs-3 col-xs-offset-9 text-right ${ className }` }
			>
				<Button
					icon="plus-alt2"
					className="btn-add col-xs-12"
					aria-label={ __( 'Add', 'better-wp-security' ) }
					tabIndex="0"
					onClick={ onClick }
					disabled={ disabled }
				/>
			</p>
		</div>
	);
}
