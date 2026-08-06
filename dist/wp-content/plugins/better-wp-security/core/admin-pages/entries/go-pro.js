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
import App from './go-pro/app.js';

domReady( () => {
	const el = document.getElementById( 'itsec-go-pro-root' );
	if ( el ) {
		createRoot( el ).render( <App /> );
	}
} );
