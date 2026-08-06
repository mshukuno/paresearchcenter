import styled from '@emotion/styled';

import { StellarSitesLogo } from '@ithemes/security-style-guide';
import { Button } from '@wordpress/components';

export const StyledStellarSitesContainer = styled.div`
	container-type: inline-size;
	margin: 1.25rem auto 0;
	display: flex;
	justify-content: center;
`;

export const StyledStellarSites = styled.aside`
	overflow: hidden;
	position: relative;
	display: flex;
	align-items: center;
	gap: 5rem;
	margin: 0 1.5rem;
	background-image: 
		linear-gradient(
			77deg, 
			rgba(218, 106, 249, 0.5) -41%,
			#1d202f 44%,
			#1d202f 55%,
			rgba(255, 186, 0, 0.8) 150%
		),
		linear-gradient(to bottom, #1d202f, #1d202f);
	
	padding: 2.5rem 5.5rem 1.75rem 1.25rem;
	max-width: 27rem;
	
	@container (min-width: 72rem) {
		max-width: 80rem;
		padding: 2rem 3.25rem;
	}
`;

export const StyledPrimaryColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: flex-start;
`;

export const StyledHeadline = styled.h2`
	font-size: 24px;
	line-height: 1.25;
	color: #f9faf9;
	font-weight: bold;
	margin: 0;
`;

export const StyledSubhead = styled.h3`
	font-size: 17px;
	line-height: 1.25;
	color: #f9faf9;
	font-weight: normal;
	margin: 0;
`;

export const StyledText = styled.p`
	font-size: 15px;
	line-height: 22px;
	color: #f9faf9;
	border: 1px solid #a3a3a3;
	padding: 1rem 0.75rem;
	margin: 0;
	max-width: 50ch;
	position: relative;
	
	display: none;
	
	@container (min-width: 72rem) {
		display: block;
	}
`;

export const StyledEditorLeft = styled.img`
	position: absolute;
	top: 0;
	left: -16px;
`;

export const StyledEditorTop = styled.img`
	position: absolute;
	top: -5px;
	left: 8px;
`;

export const StyledButton = styled.a`
	display: inline-block;
	color: #0d1117;
	font-size: 1rem;
	font-weight: bold;
	line-height: 1.25rem;
	text-decoration: none;
	text-align: center;
	padding: 0.75rem 2rem;
	border-radius: 500px;
	box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.2);
	background-image: linear-gradient(21deg, #fa0 20%, #ffe476);
	
	&:hover {
		background-image: linear-gradient(to top, #fa0 20%, #ffe476);
		color: #0d1117;
	}
`;

export const StyledGraphic = styled( StellarSitesLogo )`
	position: absolute;
	right: -2.5rem;
	bottom: 1rem;
	
	@container (min-width: 72rem) {
		position: relative;
		margin-left: auto;
		right: unset;
		bottom: unset;
	}
`;

export const StyledDismiss = styled( Button )`
	position: absolute;
	top: 1rem;
	right: 1rem;
	color: white;
	z-index: 2;

	&:hover, &:active, &:focus {
		color: white !important;
	}
`;
