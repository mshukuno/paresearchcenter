/**
 * External dependencies
 */
import { ThemeProvider, useTheme } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close as dismissIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useLocalStorage } from '@ithemes/security-hocs';
import { CentralScreenshots, SecurityScreenshots } from '@ithemes/security-style-guide';
import {
	StyledStellarSale,
	StyledStellarSaleContent,
	StyledStellarSaleHeading,
	StyledStellarSaleActions,
	StyledStellarSaleDismiss,
	StyledStellarSaleButton,
	StyledStellarSaleGraphic,
	StyledStellarSaleLink,
} from './styles';

// Start on November 24 at midnight.
const start = Date.UTC( 2025, 10, 24, 4, 0, 0 );
// End at midnight ET December 2.
const end = Date.UTC( 2025, 11, 2, 4, 0, 0 );
const now = Date.now();

export default function StellarSale( { installType } ) {
	const isSmall = useViewportMatch( 'small', '<' );
	const isWide = useViewportMatch( 'wide' );

	const [ isDismissed, setIsDismiss ] = useLocalStorage(
		'itsecBFCM25'
	);
	const baseTheme = useTheme();
	const theme = useMemo( () => ( {
		...baseTheme,
		colors: {
			...baseTheme.colors,
			text: {
				...baseTheme.colors.text,
				white: '#F9FAF9',
			},
		},
	} ), [ baseTheme ] );

	if ( start > now || end < now ) {
		return null;
	}

	if ( isDismissed ) {
		return null;
	}

	const title = installType === 'free'
		? __( 'Protect Your Site With Pro', 'better-wp-security' )
		: __( 'Backup. Manage. Save.', 'better-wp-security' );
	const buttonText = installType === 'free'
		? __( 'Get Security Pro', 'better-wp-security' )
		: __( 'Get Solid Suite', 'better-wp-security' );
	const linkText = installType === 'free'
		? __( 'View PRO Benefits', 'better-wp-security' )
		: __( 'Explore Suite Features', 'better-wp-security' );
	const shopNow =
		installType === 'free'
			? 'https://go.solidwp.com/bfcm25-get-security-pro'
			: 'https://go.solidwp.com/bfcm25-solid-security-pro-get-solid-suite';
	const learnMoreLink =
		installType === 'free'
			? 'https://go.solidwp.com/bfcm25-view-pro-benefits'
			: 'https://go.solidwp.com/bfcm25-explore-suite-features';

	return (
		<ThemeProvider theme={ theme }>
			<StyledStellarSale isWide={ isWide }>
				<StyledStellarSaleContent>
					<StyledStellarSaleHeading
						level={ 2 }
						variant="white"
						weight={ 300 }
						size="extraLarge"
						isSmall={ isSmall }
					>
						<strong>{ title }</strong>
						<br />
						{ __( 'Lock in 30% Off This Black Friday', 'better-wp-security' ) }
					</StyledStellarSaleHeading>

					<StyledStellarSaleActions>
						<StyledStellarSaleButton
							href={ shopNow }
							weight={ 600 }
						>
							{ buttonText }
						</StyledStellarSaleButton>
						{ ! isSmall && (
							<StyledStellarSaleLink
								as="a"
								href={ learnMoreLink }
								target="_blank"
								variant="white"
								weight={ 700 }
								size="subtitleSmall"
								isSmall={ isSmall }
							>
								{ linkText }
							</StyledStellarSaleLink>
						) }
					</StyledStellarSaleActions>
				</StyledStellarSaleContent>
				{ isWide &&
					( installType === 'free' ? (
						<SecurityScreenshots />
					) : (
						<CentralScreenshots />
					) ) }
				<StyledStellarSaleDismiss
					label={ __( 'Dismiss', 'better-wp-security' ) }
					icon={ dismissIcon }
					onClick={ () => setIsDismiss( true ) }
				/>
				{ ! isSmall && <StyledStellarSaleGraphic /> }
			</StyledStellarSale>
		</ThemeProvider>
	);
}
