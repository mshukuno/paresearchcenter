/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { ToolbarFill } from '@ithemes/security-ui';
import '@ithemes/security.core.admin-notices-api';
import ToolbarButton from './admin-notices/components/toolbar-button';

registerPlugin( 'itsec-admin-notices-toolbar', {
	render() {
		return (
			<ToolbarFill>
				<ToolbarButton />
			</ToolbarFill>
		);
	},
} );
