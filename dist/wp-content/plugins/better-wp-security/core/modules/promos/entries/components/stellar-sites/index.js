/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { close as dismissIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useLocalStorage } from '@ithemes/security-hocs';
import {
	StyledButton,
	StyledDismiss,
	StyledEditorLeft,
	StyledEditorTop,
	StyledGraphic,
	StyledHeadline,
	StyledPrimaryColumn,
	StyledStellarSites,
	StyledStellarSitesContainer,
	StyledSubhead,
	StyledText,
} from './styles';
import editorLeft from './editor-left.png';
import editorTop from './editor-top.png';

// Start on July 29th at midnight.
const saleStart = Date.UTC( 2025, 6, 29, 4, 0, 0 );
// End at midnight ET August 5
const saleEnd = Date.UTC( 2025, 7, 6, 4, 0, 0 );

// Stop at the end of September
const end = Date.UTC( 2025, 8, 30, 23, 0, 0 );

const now = Date.now();

export default function StellarSites( { installType } ) {
	const [ isDismissed, setIsDismissed ] = useLocalStorage(
		'itsecPromoStellarSites'
	);

	if ( isDismissed ) {
		return null;
	}

	if ( ( now > saleStart && now < saleEnd ) || now > end ) {
		return null;
	}

	const link = installType === 'free'
		? 'https://go.solidwp.com/stellarsites-banner-security-pro'
		: 'https://go.solidwp.com/stellarsites-banner-security-free';
	const text = installType === 'free'
		? __( 'Explore StellarSites', 'better-wp-security' )
		: __( 'Learn More About StellarSites', 'better-wp-security' );

	return (
		<StyledStellarSitesContainer>
			<StyledStellarSites>
				<StyledPrimaryColumn>
					<StyledHeadline>
						{ __( 'Build & Protect Sites Faster.', 'better-wp-security' ) }
					</StyledHeadline>
					<StyledSubhead>
						{ __( 'Introducing StellarSites from Nexcess', 'better-wp-security' ) }
					</StyledSubhead>
					<StyledButton href={ link }>{ text }</StyledButton>
				</StyledPrimaryColumn>
				<StyledText>
					<StyledEditorLeft src={ editorLeft } alt="" width={ 15 } />
					<StyledEditorTop src={ editorTop } alt="" height={ 11 } />
					{ __( 'Secure your site from the start with fast hosting, cloud-first backups, and powerful site management tools built to scale.', 'better-wp-security' ) }
				</StyledText>
				<StyledGraphic />
				<StyledDismiss
					label={ __( 'Dismiss', 'better-wp-security' ) }
					icon={ dismissIcon }
					onClick={ () => setIsDismissed( true ) }
				/>
			</StyledStellarSites>
		</StyledStellarSitesContainer>
	);
}
