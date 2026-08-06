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
import App from './tools/app.js';
import { createHistory } from './settings/history';

const history = createHistory( document.location, { page: 'itsec-tools' } );

domReady( () => {
	const el = document.getElementById( 'itsec-tools-root' );
	if ( el ) {
		createRoot( el ).render( <App history={ history } /> );
	}
} );

export { ToolFill } from './tools/components/tool-panel/tool-panel';
export {
	BeforeImportExportToolsFill,
	AfterImportExportToolsFill,
	ExportFill,
} from './tools/components/slot-fill/index';
export { StyledPageContainer as PageContainer } from './tools/components/styles';
export { default as PageHeader } from './tools/components/page-header';
