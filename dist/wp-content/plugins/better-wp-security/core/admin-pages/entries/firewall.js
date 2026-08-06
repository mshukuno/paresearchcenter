/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import { setLocaleData } from '@wordpress/i18n';

// Silence warnings until JS i18n is stable.
setLocaleData( { '': {} }, 'ithemes-security-pro' );

/**
 * Internal dependencies
 */
import App from './firewall/app.js';
import { createHistory } from './settings/history';

const history = createHistory( document.location, { page: 'itsec-firewall' } );

domReady( () => {
	const el = document.getElementById( 'itsec-firewall-root' );
	if ( el ) {
		createRoot( el ).render( <App history={ history } /> );
	}
} );

export {
	BeforeCreateFirewallRuleFill,
	AsideHeaderFill,
	FirewallBannerFill,
} from './firewall/components';
