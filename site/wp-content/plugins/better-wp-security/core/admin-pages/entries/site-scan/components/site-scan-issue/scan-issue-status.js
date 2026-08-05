/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Kadence dependencies
 */
import { Text } from '@ithemes/ui';

/**
 * Internal dependencies
 */
import { StatusIcon } from '@ithemes/security-ui';

function getScanIssueStatusText( status ) {
	switch ( status ) {
		case 'attention':
			return __( 'Needs Attention', 'better-wp-security' );
		case 'mitigated':
			return __( 'Mitigated', 'better-wp-security' );
	}
}
export default function ScanIssueStatus( { issue } ) {
	const status = issue?.status || 'attention';
	return (
		<Text
			icon={ <StatusIcon status={ status } /> }
			iconSize={ 16 }
			text={ getScanIssueStatusText( status ) }
		/>
	);
}
