/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import App from './vulnerabilities/app';
import { createHistory } from './settings/history';

const history = createHistory( document.location, { page: 'itsec-vulnerabilities' } );

domReady( () => {
	const containerEl = document.getElementById( 'itsec-vulnerabilities-root' );

	if ( containerEl ) {
		createRoot( containerEl ).render(
			<App history={ history } />
		);
	}
} );

export { BeforeHeaderFill } from './vulnerabilities/components/before-header/index';
export { vulnerabilityIcon } from './vulnerabilities/components/vulnerability-table';
