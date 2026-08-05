/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import {
	brush as themeIcon,
	plugins as pluginIcon,
	wordpress as coreIcon,
} from '@wordpress/icons';

/**
 * Kadence dependencies
 */
import { List, Surface, Text } from '@ithemes/ui';
import { VulnerabilitySuccess } from '@ithemes/security-style-guide';

export function vulnerabilityIcon( type ) {
	switch ( type ) {
		case 'plugin':
			return pluginIcon;
		case 'theme':
			return themeIcon;
		case 'core':
			return coreIcon;
		default:
			return undefined;
	}
}

export const StyledEmptyState = styled( Surface )`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: ${ ( { theme: { getSize } } ) => `${ getSize( 1.5 ) } 0` };
	gap: ${ ( { theme: { getSize } } ) => getSize( 0.75 ) };
`;

export const StyledContainer = styled( Surface )`
	display: flex;
	flex-direction: column;
	height: 100%;
	container-type: inline-size;
	overflow: auto;
`;

export const StyledBrand = styled.div`
	display: flex;
	flex-direction: ${ ( { direction } ) => direction === 'row' ? 'row' : 'column' };
	gap:  ${ ( { direction } ) => direction === 'row' && '0.5rem' };
	align-items: ${ ( { direction } ) => direction === 'row' ? 'center' : 'flex-end' };

	& span {
		font-size: ${ ( { isSmall } ) => isSmall && '0.5rem' };
	}
	& svg {
		width: ${ ( { isSmall } ) => isSmall && '100px' };
	}
`;

export const StyledTitleContainer = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 0.5rem;
`;

export const StyledDivider = styled.hr`
	width: 1px;
	height: 1rem;
	margin: 0;
	background-color: ${ ( { theme } ) => theme.colors.border.muted };
`;

export const StyledGetPro = styled.a`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 0.75rem;
	padding: 0.25rem 0.75rem;
	border: ${ ( { isSmall, theme } ) => ! isSmall && `1px solid ${ theme.colors.border.muted }` };
	border-radius: 0.25rem;
	text-decoration: none;
	
	& svg {
		flex: 1 0 24px;
	}
`;

export const StyledGetProText = styled.div`
	display: flex;
	flex-direction: column;
	
	& > span {
		color: ${ ( { theme } ) => theme.colors.text.muted };
		
		&:first-of-type {
			font-weight: 600;
			color: #1145c9;
		}
	}
`;

export const StyledFooter = styled( Surface )`
	display: flex;
	justify-content: flex-end;
	position: sticky;
	bottom: 0;
	padding: 0.5rem 1.25rem;
	margin-top: auto;
	border-top: 1px solid ${ ( { theme } ) => theme.colors.border.normal };
`;

export const StyledVulnerabilitySuccess = styled( VulnerabilitySuccess )`
	height: 56px;
	width: 56px;
`;

export const StyledSuccessText = styled( Text )`
	padding: ${ ( { theme: { getSize } } ) => `0 ${ getSize( 0.5 ) }` };
`;

// Table-specific styles
export const StyledVulnerabilityName = styled( Text )`
	grid-area: name;
`;

export const StyledVulnerabilityVersion = styled( Text )`
	grid-area: version
`;

export const StyledVulnerabilityDetail = styled( Text )`
	grid-area: detail;
`;

export const StyledVulnerability = styled( Surface, {
	shouldForwardProp: ( prop ) => prop !== 'isWide',
} )`
	display: grid;
	grid-template-columns: ${ ( { isWide } ) => isWide ? '1fr 1fr 1fr' : '1fr 0.5fr 1fr' };
	grid-template-areas: ${ ( { isWide } ) => isWide ? '"name version detail"' : '"name name name" "version detail detail"' };
	align-items: center;
`;

export const StyledTableSection = styled( Surface )`
	flex-shrink: 1;
	overflow-y: auto;
	position: relative;
`;

// List-specific styles
export const StyledStatusResolution = styled( Text )`
	grid-column: 2;
`;

export const StyledListHeading = styled( Text )`
	padding: 0.875rem;
	text-transform: uppercase;
	background-color: ${ ( { theme } ) => theme.colors.surface.tertiary };
	border-bottom: 1px solid ${ ( { theme } ) => theme.colors.border.normal };
`;

export const StyledList = styled( List )`
	padding: 0.5rem 0.25rem 0.5rem 0.5rem;
	border-bottom: 1px solid ${ ( { theme } ) => theme.colors.border.normal };
`;

export const StyledTopRow = styled( Surface )`
	display: grid;
	align-items: center;
	grid-template-columns: 1fr 1.25fr 0.75fr 1fr;
	margin-bottom: 1rem;
`;

export const StyledBottomRow = styled( Surface )`
	display: grid;
	align-items: center;
	grid-template-columns: 1fr 1fr 1fr 1fr;
`;

export const StyledLink = styled.a`
	grid-column: 4;
`;
