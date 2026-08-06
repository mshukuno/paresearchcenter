/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { coreStore } from '@ithemes/security.packages.data';
import { ModulePanelHeaderFill } from '@ithemes/security.pages.settings';
import { GetProMalwareScheduling, StellarSale } from '@ithemes/security.promos.components';
import { ToolbarFill } from '@ithemes/security-ui';

export default function App() {
	const { installType } = useSelect(
		( select ) => ( {
			installType: select( coreStore ).getInstallType(),
		} ),
		[]
	);
	return (
		<>
			<ModulePanelHeaderFill>
				{ ( { module } ) => module.id === 'malware-scheduling' &&
					installType === 'free' &&
					<GetProMalwareScheduling /> }
			</ModulePanelHeaderFill>
			<ToolbarFill area="banner">
				<StellarSale installType={ installType } />
			</ToolbarFill>
		</>
	);
}
