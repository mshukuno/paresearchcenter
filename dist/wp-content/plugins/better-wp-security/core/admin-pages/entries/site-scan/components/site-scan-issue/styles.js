/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * iThemes dependencies
 */
import { Surface, Text } from '@ithemes/ui';

export const StyledScanInfo = styled.div`
	display: grid;
	grid-column-gap: 2rem;
	grid-template-columns: 0.5fr 1fr;
	overflow-wrap: anywhere;
`;

export const StyledDetailsContainer = styled.div`
	display: flex;
	gap: 2rem;
	flex-wrap: wrap;
	justify-content: space-between;
`;

export const StyledRowDetailsContainer = styled( Surface )`
	display: ${ ( { isExpanded } ) => isExpanded ? 'table-row' : 'none' };
`;

export const StyledDetailContent = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 2rem;
`;

export const StyledDetailColumn = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	max-width: 70ch;
`;

export const StyledScanIssueText = styled( Text )`
	line-height: 1.3rem;
	margin-top: .4rem;
`;

// tablet layout
export const StyledCombinedColumns = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

export const StyledAction = styled.td`
	text-align: right;
`;

// Mobile list styles

export const StyledListItem = styled.div`
	display: grid;
	grid-template-columns: 2fr 1fr 0.5fr;
	gap: 1rem;
	overflow-wrap: anywhere;
	align-items: center;
	padding: 1rem;
`;

export const StyledListDetailsContainer = styled( Surface )`
	display: ${ ( { isExpanded } ) => ! isExpanded && 'none' };
	padding: 1rem;
`;
