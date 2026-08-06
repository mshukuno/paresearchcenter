/**
 * External dependencies
 */
import { ThemeProvider } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * iThemes dependencies
 */
import { solidTheme } from '@ithemes/ui';

/**
 * Internal dependencies
 */
import {
	StyledMainContainer,
	StyledMain,
	StyledProLogo,
	StyledUpsellText,
	StyledUpsellButton,
} from './style.js';

export default function App() {
	return (
		<ThemeProvider theme={ solidTheme }>
			<StyledMainContainer className="itsec-go-pro">
				<StyledProLogo />
				<StyledMain>
					<StyledUpsellText
						text={ createInterpolateElement(
							__( 'The only WordPress security plugin you need — <i>period</i>', 'better-wp-security' ), {
								i: <span />,
							} ) }
					/>
					<StyledUpsellButton
						variant="primary"
						text={ __( 'Get Kadence Security Pro', 'better-wp-security' ) }
						href={ 'https://go.solidwp.com/basic-to-pro' }
					/>
				</StyledMain>
			</StyledMainContainer>
		</ThemeProvider>
	);
}
