/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';
import { __, setLocaleData } from '@wordpress/i18n';
import { dispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

// Silence warnings until JS i18n is stable.
setLocaleData( { '': {} }, 'ithemes-security-pro' );

/**
 * Internal dependencies
 */
import { store } from '@ithemes/security.pages.site-scan';
import { siteScannerStore, vulnerabilitiesStore } from '@ithemes/security.packages.data';
import App from './site-scan/app.js';

/**
 * @param {number | null }  priority
 * @param {number | score } score
 * @return {string} Severity level
 */
function severityLevel( priority, score ) {
	return Number.isInteger( priority ) ? severityFromPriority( priority ) : severityFromScore( score );
}

function severityFromPriority( priority ) {
	switch ( true ) {
		case priority <= 1:
			return 'low';
		case priority <= 2:
			return 'medium';
		default:
			return 'high';
	}
}

function severityFromScore( score ) {
	switch ( true ) {
		case score < 3:
			return 'low';
		case score < 7:
			return 'medium';
		default:
			return 'high';
	}
}

async function googleStatus( id ) {
	return apiFetch( {
		method: 'GET',
		path: `/ithemes-security/v1/site-scanner/scans/${ id }/issues?entry=blacklist`,
	} );
}

function transform( apiData ) {
	const issue = {
		id: apiData.id,
		meta: apiData,
		_links: apiData._links,
		status: 'attention',
	};

	if ( apiData.id === 'google' ) {
		issue.component = apiData.entry;
		issue.title = apiData.description;
		issue.severity = 'high';
	} else {
		issue.component = apiData.software.type.slug;
		issue.title = apiData.software.label || apiData.software.slug || __( 'WordPress', 'better-wp-security' );
		issue.description = apiData.details.type.label;
		issue.muted = apiData.resolution?.slug === 'muted';
		issue.severity = severityLevel( apiData.details?.patch_priority, apiData.details?.score );
		issue.status = apiData.resolution?.slug === 'patched' ? 'mitigated' : 'attention';
	}
	return issue;
}

dispatch( store ).registerScanComponent( {
	slug: 'plugin',
	priority: 15,
	label: __( 'Plugins', 'better-wp-security' ),
	description: __( 'Check for plugins with known vulnerabilities', 'better-wp-security' ),
	group: 'site-scanner',
} );
dispatch( store ).registerScanComponent( {
	slug: 'theme',
	priority: 16,
	label: __( 'Themes', 'better-wp-security' ),
	description: __( 'Check for themes with known vulnerabilities', 'better-wp-security' ),
	group: 'site-scanner',
} );
dispatch( store ).registerScanComponent( {
	slug: 'wordpress',
	priority: 17,
	label: __( 'WordPress Core', 'better-wp-security' ),
	description: __( 'Check for known WordPress Core vulnerabilities', 'better-wp-security' ),
	group: 'site-scanner',
} );
dispatch( store ).registerScanComponent( {
	slug: 'blacklist',
	priority: 18,
	label: __( 'Google Safe Browsing', 'better-wp-security' ),
	description: __( 'Check if your site is safe according to Google Safe Browsing', 'better-wp-security' ),
	group: 'site-scanner',
} );
dispatch( store ).registerScanComponentGroup( {
	slug: 'site-scanner',
	components: [ 'plugin', 'theme', 'wordpress', 'blacklist' ],
	async execute() {
		const scan = await dispatch( siteScannerStore ).runScan();
		const results = await googleStatus( scan.id );
		const issues = results.filter( ( issue ) => issue.status !== 'clean' );
		const vulnerabilities = await dispatch( vulnerabilitiesStore ).query( 'siteScanner', {
			resolution: [ '', 'patched', 'muted' ],
			per_page: 100,
		} );
		const siteScannerIssues = vulnerabilities.concat( issues );
		return siteScannerIssues.map( transform );
	},

	transform,
} );

registerPlugin( 'itsec-site-scanner-site-scan', {
	render() {
		return <App />;
	},
} );
