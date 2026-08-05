/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Kadence dependencies
 */
import { Surface, Text, Button } from '@ithemes/ui';

/**
 * Internal dependencies
 */
import { Patchstack, PatchstackMark } from '@ithemes/security-style-guide';

export const StyledAutomatedBannerSurface = styled( Surface )`
	position: relative;
	padding: 1.5rem;
	border-radius: 8px;
`;

export const StyledGridContainer = styled.div`
	display: grid;
	grid-template-columns: ${ ( { isMedium } ) => isMedium
		? '1fr' : '1.25fr 0.75fr' };
	gap: .8rem;
	margin-bottom: ${ ( { isMedium } ) => isMedium
		? '.8rem' : '0' };
  	
	.itsec-basic-banner-title svg {
		width: 78px;
		height: 25px;
	}
`;

export const StyledBannerTitle = styled( Text )`
	font-size: 1.125rem;
`;

export const StyledButton = styled( Button,
	{ shouldForwardProp: ( propName ) => propName !== 'singleColumn' } )`
	padding-left: 10px !important;
	justify-self: ${ ( { singleColumn } ) => singleColumn
		? 'start' : 'end' };
	align-self: center;
`;

export const StyledBadge = styled( Text )`
	align-self: start;
	justify-self: ${ ( { isMedium } ) => isMedium
		? 'start' : 'end' };
	height: fit-content;
	background: #E9EFFC;
	border: 1px solid #E0E0E0;
	border-radius: 20px;
	padding: 4px 16px 4px 12px;
	margin-right: 2.5rem;
`;

export const StyledAutomatedCardSurface = styled( Surface )`
	padding: 1.25rem;
	border-radius: 8px;
`;

export const StyledPatchstackMark = styled( PatchstackMark )`
	width: 24px;
	height: 18px;
	align-self: start;
`;

export const StyledCardText = styled( Text )`
	padding-bottom: 2.5rem;
`;

export const StyledAutomatedCardHeader = styled( Text )`
	padding-bottom: .75rem;
`;

export const StyledTableContainer = styled( Surface ) `
	width: 100%;
`;

export const StyledAutomatedVulnerabilityTableHeader = styled( Surface )`
	padding: 1.5rem;
	display: grid;
	grid-template-columns: ${ ( { isMedium } ) => isMedium
		? '1fr' : '1fr 0.5fr' };
	align-items: center;
	gap: .8rem;
`;

export const StyledVulnerabilityTableHeaderText = styled( Text )`
	display: ${ ( { hasPatchstack } ) => ! hasPatchstack && 'flex' };
	align-items: center;

	.itsec-header-title-small {
		color: #1145C9;
	}

	.itsec-header-title-large {
		font-size: 2rem;
		color: #1145C9;
		padding-right: .5rem;
	}
`;

export const StyledBrand = styled.div`
	display: flex;
	flex-direction: column;
	align-items: ${ ( { isMedium } ) => isMedium
		? 'flex-start' : 'flex-end' };
	align-self: start;
`;

export const StyledLogoText = styled( Text )`
	font-size: 0.625rem;
`;

export const StyledLogoImage = styled( Patchstack, {
	shouldForwardProp: ( prop ) => prop !== 'isLarge',
} )`
	width: ${ ( { isLarge } ) => isLarge ? '170px' : '124px' }
`;

export const StyledCombinedColumns = styled.div`
	display: grid;
	grid-template-columns: ${ ( { isSmall } ) => isSmall
		? '1fr 1fr'
		: '0.5fr 0.5fr 1fr'
};
	grid-template-areas: "name version detail";
	justify-items: start;
	gap: 0.6rem;
`;

export const StyledVulnerabilityName = styled( Text )`
	grid-area: name;
`;

export const StyledVulnerabilityVersion = styled( Text )`
	grid-area: version
`;

export const StyledVulnerabilityDetail = styled( Text )`
	grid-area: detail;
`;

export const StyledTableSection = styled( Surface )`
	flex-shrink: 1;
	position: relative;
	overflow-y: auto;
	max-height: 31vh;
  
	@media ( max-width: 1100px ) {
		max-height: 35vh;
	}
  
	@media ( max-width: 700px ) {
		max-height: 46vh;
	}
  
`;

export const StyledRow = styled.tr`
	vertical-align: ${ ( { isSmall, isLarge } ) => ( ! isSmall && ! isLarge ) && 'top' };
`;

export const StyledThead = styled( Text )`
	background: #F5F5F5;
	padding: .625rem;
	border-collapse: collapse;
	overflow-y: auto;
	width: ${ ( { shrink } ) => shrink && '0.1%' };
	white-space: ${ ( { shrink } ) => shrink && 'nowrap' };
`;

export const StyledTableCell = styled.td`
	width: 0.1%;
	white-space: nowrap;
`;

export const StyledTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	
	& td {
		padding: .625rem;
	}
`;

export const StyledTableCardContainer = styled.div`
	display: grid;
	justify-items: start;
  	gap: .8rem; 
	grid-template-columns: ${ ( { isSmall } ) => isSmall
		? '1fr' : '1fr 0.5fr' };
`;

export const StyledNoVulnerabilitiesContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2rem;
	padding: 2rem;
  
	svg {
		margin: 0 auto;
	}
`;

export const StyledNoVulnerabilitiesButton = styled( Button )`
	width: fit-content;
	color: #0E38A3;
	margin: 0 auto;
`;

export const StyledColumnContainer = styled.div`
	display: grid;
  	grid-template-rows: 1fr 1fr;
	gap: .8rem;
`;

export const StyledHasPatchstackDismiss = styled( Button )`
	position: absolute;
	top: 1rem;
	right: 1rem;
	box-shadow: inset 0 0 0 1px transparent !important;
	svg {
		fill: ${ ( { theme } ) => theme.colors.text.normal };
		&:hover, &:active, &:focus {
			fill: #1145c9;
		}
	}
`;
