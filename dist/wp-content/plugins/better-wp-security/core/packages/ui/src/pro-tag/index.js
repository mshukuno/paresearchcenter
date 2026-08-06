/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Kadence dependencies
 */
import { Surface, SurfaceVariant, Text, TextSize, TextVariant, TextWeight } from '@ithemes/ui';

export default function ProTag( { as = 'div' } ) {
	return (
		<StyledProSiteTag variant={ SurfaceVariant.DARK } as={ as }>
			<Text
				size={ TextSize.SMALL }
				variant={ TextVariant.WHITE }
				weight={ TextWeight.HEAVY }
				text={ __( 'Pro', 'better-wp-security' ) }
			/>
		</StyledProSiteTag>
	);
}

const StyledProSiteTag = styled( Surface )`
	display: flex;
	align-items: center;

	padding: 1px 8px;

	background-image: linear-gradient(
		116deg,
		#1145c9 0%,
		#1145c9 36%,
		#1145c9 100%
	);

	border-radius: 5px;
`;
