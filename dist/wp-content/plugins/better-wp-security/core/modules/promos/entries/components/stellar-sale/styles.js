/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * iThemes dependencies
 */
import { Text, Heading } from '@ithemes/ui';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

import { ConnectedNodes } from '@ithemes/security-style-guide';

export const StyledStellarSale = styled.aside`
	position: relative;
	display: grid;
	grid-template-columns: ${ ( { isWide } ) => isWide ? '1.5fr 1fr 1fr' : '2fr 1fr' };
	margin: 1.25rem 1.25rem 0;
	background: #1D202F;
	color: #F9FAF9;
	padding: 1rem;
	overflow: hidden;
`;

export const StyledStellarSaleDismiss = styled( Button )`
	color: white;
	z-index: 2;
	justify-content: end !important;

	&:hover, &:active, &:focus {
		color: white !important;
	}
`;

export const StyledStellarSaleContent = styled.div`
	z-index: 1;
	max-width: 50rem;
	display: flex;
	flex-direction: column;
	gap: 1rem 1.5rem;
	justify-items: start;
	padding: 1.25rem 4.45rem 0.65rem 2.9rem;
`;

export const StyledStellarSaleHeading = styled( Heading )`
	grid-column: ${ ( { isSmall } ) => ! isSmall && 'span 2' };
  
	strong {
		font-size: 1.5rem;
	}
`;

export const StyledStellarSaleActions = styled.div`
	display: flex;
	gap: 1.5rem;
`;

export const StyledStellarSaleButton = styled.a`
	display: inline-flex;
	min-width: max-content;
	padding: 0.75rem 1.75rem;
	justify-content: center;
	align-items: center;
	color: #ffffff;
	font-size: 0.83569rem;
	text-align: center;
	text-transform: uppercase;
	text-decoration: none;
	border-radius: 7.8125rem;
	background: #1145C9;

	&:hover, &:active, &:focus {
		color: inherit;
		opacity: 0.75;
	}
`;

export const StyledStellarSaleLink = styled( Text )`
	text-decoration: underline;
	align-self: ${ ( { isSmall } ) => isSmall ? 'start' : 'center' };

	&:hover, &:active, &:focus {
		color: inherit;
		font-style: oblique;
	}
`;

export const StyledStellarSaleGraphic = styled( Graphic )`
	position: absolute;
	right: 0;
	bottom: 0;
`;

function Graphic( { className } ) {
	return <ConnectedNodes className={ className } />;
}
