/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Solid dependencies
 */
import { Surface } from '@ithemes/ui';

/**
 * Internal dependencies
 */
import { Logo } from '@ithemes/security-ui';

export const StyledMainContainer = styled( Surface )`
	position: relative;
	height: auto;
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	align-items: start;
	gap: 2rem;
	padding: 1.25rem;
`;

export const StyledMain = styled.main`
	position: relative;
	width: 100%;
	align-self: center;
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	align-items: center;
	justify-content: center;
`;

export const StyledLogo = styled( Logo )`
	height: 44px;
	width: auto;
`;
