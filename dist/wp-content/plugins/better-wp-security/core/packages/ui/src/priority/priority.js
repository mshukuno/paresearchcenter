/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Kadence dependencies
 */
import { Text, TextSize, TextVariant, TextWeight } from '@ithemes/ui';

/**
 * Internal dependencies
 */
import PriorityIcon from './icons';
import { StyledCompactContainer, StyledExtendContainer, StyledPriorityDescription } from './styles';

/**
 * @typedef {'low' | 'medium' | 'high'} PriorityEnum
 */

/**
 * @typedef {Object} PriorityProps
 * @property {PriorityEnum} priority      Priority
 * @property {boolean}      [isExpanded]  Should be presented in expanded form
 * @property {string}       [description] Optional description
 */

/**
 * @param {PriorityEnum} priority
 * @return {string} Short textual description
 */
export function priorityText( priority ) {
	switch ( true ) {
		case priority === 'low':
			return __( 'Low', 'better-wp-security' );
		case priority === 'medium':
			return __( 'Medium', 'better-wp-security' );
		default:
			return __( 'High', 'better-wp-security' );
	}
}

/**
 * @param {PriorityEnum} priority
 * @return {string} Expanded textual description
 */
export function priorityExpandedText( priority ) {
	switch ( true ) {
		case priority === 'low':
			return __( 'Low priority', 'better-wp-security' );
		case priority === 'medium':
			return __( 'Medium priority', 'better-wp-security' );
		default:
			return __( 'High priority', 'better-wp-security' );
	}
}

function Compact( { priority } ) {
	return	<StyledCompactContainer priority={ priority }>
		<PriorityIcon priority={ priority } />
		<Text
			text={ priorityText( priority ) }
			weight={ priority === 'high' ? TextWeight.HEAVY : TextWeight.NORMAL }
			variant={ priority === 'high' ? TextVariant.WHITE : TextVariant.NORMAL }
		/>
	</StyledCompactContainer>;
}

function Expanded( { priority, description } ) {
	return	<StyledExtendContainer priority={ priority }>
		<PriorityIcon priority={ priority } />
		<StyledPriorityDescription>
			<Text
				text={ priorityExpandedText( priority ) }
				weight={ TextWeight.HEAVY }
				size={ TextSize.LARGE }
			/>
			{ description && <Text text={ description } /> }
		</StyledPriorityDescription>
	</StyledExtendContainer>;
}

/**
 * The component represents a generic priority.
 *
 * @param {PriorityProps} props
 * @return {JSX.Element} Priority React component
 */
export default function Priority( { priority, isExpanded, description } ) {
	return isExpanded
		? <Expanded priority={ priority } description={ description } />
		: <Compact priority={ priority } />;
}
