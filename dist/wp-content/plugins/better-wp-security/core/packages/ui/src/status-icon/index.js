/**
 * WordPress dependencies
 */
import { check as checkIcon, closeSmall as closeIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { VulnerabilityMitigated } from '@ithemes/security-style-guide';
import {
	StyledStatusCheck,
	StyledStatusRedCircle,
} from './styles';

/**
 * @typedef {Object} StatusIconProps
 * @property { 'attention' | 'resolved' | 'mitigated' } status Status of the vulnerability issue
 */

/**
 * @param {StatusIconProps} props
 */
export default function StatusIcon( { status, ...rest } ) {
	switch ( status ) {
		case 'attention':
			return <StyledStatusRedCircle icon={ closeIcon } style={ { fill: '#D75A4B' } } { ...rest } />;
		case 'resolved':
			return <StyledStatusCheck icon={ checkIcon } style={ { fill: '#FFFFFF' } } { ...rest } />;
		case 'mitigated':
			return <VulnerabilityMitigated { ...rest } />;
		default:
			return null;
	}
}
