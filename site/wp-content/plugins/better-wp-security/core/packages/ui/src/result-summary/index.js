/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Solid dependencies
 */
import { MessageList } from '@ithemes/ui';

/**
 * Internal dependencies
 */
import { ErrorList } from '../';

const StyledResultSummary = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 0.5rem';
`;

export default function ResultSummary( {
	result,
	hasBorder,
	schemaError,
	errors,
} ) {
	return (
		<StyledResultSummary>
			<ErrorList
				apiError={ result?.error }
				schemaError={ schemaError }
				errors={ errors }
				hasBorder={ hasBorder }
			/>
			{ result?.success && (
				<MessageList
					messages={ result.success }
					type="success"
					hasBorder={ hasBorder }
				/>
			) }
			{ result?.warning && (
				<MessageList
					messages={ result.warning }
					type="warning"
					hasBorder={ hasBorder }
				/>
			) }
			{ result?.info && (
				<MessageList
					messages={ result.info }
					type="info"
					hasBorder={ hasBorder }
				/>
			) }
		</StyledResultSummary>
	);
}
