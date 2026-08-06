/**
 * iThemes dependencies
 */
import { MessageList } from '@ithemes/ui';
import { transformApiErrorToList } from '@ithemes/security-utils';

/**
 * Internal dependencies
 */
import Markup from '../markup';

export default function ErrorList( {
	errors,
	apiError,
	schemaError,
	title,
	className,
	hasBorder,
} ) {
	const all = [
		...( errors || [] ),
		...transformApiErrorToList( apiError ),
		...( schemaError || [] ).map( ( error ) => error.stack ),
	];

	if ( ! all.length ) {
		return null;
	}

	// Render messages with Markup to support HTML links.
	const renderedMessages = all.map( ( message, index ) => (
		<Markup key={ index } content={ message } noWrap tagName="span" />
	) );

	return (
		<MessageList
			messages={ renderedMessages }
			heading={ title }
			className={ className }
			hasBorder={ hasBorder }
			type="danger"
		/>
	);
}
