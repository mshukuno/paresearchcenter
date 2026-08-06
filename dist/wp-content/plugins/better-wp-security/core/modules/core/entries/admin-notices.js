/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { setLocaleData } from '@wordpress/i18n';

// Silence warnings until JS i18n is stable.
setLocaleData( { '': {} }, 'better-wp-security' );

/**
 * Internal dependencies
 */
import App from './admin-notices/app.js';

domReady( () => {
	const containerEl = document.getElementById(
		'wp-admin-bar-itsec_admin_bar_menu'
	);
	const portalEl = document.getElementById( 'itsec-admin-notices-root' );

	if ( containerEl ) {
		createRoot( containerEl ).render( <App portalEl={ portalEl } /> );
	}
} );
