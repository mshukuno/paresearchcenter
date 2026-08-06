/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Priority from './priority';

/**
 * @param {number | null} priority Patchstack priority
 * @param {number | null} score    CVSS score
 * @return {'low' | 'medium' | 'high' } Normalized value
 */
export function normalize( priority, score ) {
	if ( ! Number.isInteger( priority ) ) {
		return normalizedPriorityFromScore( score );
	}

	switch ( true ) {
		case priority <= 1:
			return 'low';
		case priority <= 2:
			return 'medium';
		default:
			return 'high';
	}
}

function normalizedPriorityFromScore( score ) {
	switch ( true ) {
		case score < 3:
			return 'low';
		case score < 7:
			return 'medium';
		default:
			return 'high';
	}
}

/**
 * @typedef {Object} PatchPriorityProps
 * @property {number | null } priority     Patchstack patch priority
 * @property {number | null } [score]      CVSS score
 * @property {boolean }       [isExpanded] Should be in expanded form
 */

/**
 * The component represents Patchstack patch priority.
 *
 * @see https://docs.patchstack.com/api-solutions/threat-intelligence-api/api-properties/#data-structure
 *
 * The patch priority value of the vulnerability which implies how soon
 * the developer needs to patch the vulnerability
 * and how soon the customers need to be protected.
 *
 * NULL = unknown
 * 1 = Low → patch within 30 days
 * 2 = Medium → patch within 7 days
 * 3 or higher = High → patch immediately
 *
 * @param {PatchPriorityProps} props Patchstack patch priority.
 * @return {JSX.Element} Priority React component
 * @class
 */
export default function PatchPriority( { priority, score, isExpanded } ) {
	return	<Priority
		priority={ normalize( priority, score ) }
		isExpanded={ isExpanded }
		description={ isExpanded ? __( 'Patchstack priority', 'better-wp-security' ) : '' }
	/>;
}
