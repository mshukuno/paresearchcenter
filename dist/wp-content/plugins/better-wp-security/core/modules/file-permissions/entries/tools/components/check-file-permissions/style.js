/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */

/**
 * Kadence dependencies
 */
import { Surface, Text } from '@ithemes/ui';

export const StyledFilePermissionsToolSurface = styled( Surface )`
	margin-bottom: 1rem;
	position: relative;
	overflow: auto;
	margin-top: 1rem;
`;

export const StyledCheckFilePermissionsToolTable = styled.table`
	border: 1px solid #d4d4d4;
`;

export const StyledCheckFilePermissionsToolTH = styled( Text )`
	border-bottom: 1px solid #d4d4d4;
	border-top: none !important;
`;
