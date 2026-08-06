/**
 * External dependencies
 */
import { ErrorBoundary } from 'react-error-boundary';
import classnames from 'classnames';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { memo, forwardRef } from '@wordpress/element';

/**
 * iThemes dependencies
 */
import { Surface } from '@ithemes/ui';

/**
 * Internal dependencies
 */
import { useCardElementQueries, useCardRenderer } from '../../cards';
import CardUnknown from '../empty-states/card-unknown';
import CardCrash from '../empty-states/card-crash';
import CardModuleInactive from '../empty-states/card-module-inactive';
import './style.scss';

const StyledCard = styled( Surface )`
	width: 100%;
	height: 100%;
	border-radius: 2px;
	box-shadow: 0 0 5px rgba(211, 211, 211, 0.35);
`;

function UnforwardedCard( { id, dashboardId, className, gridWidth, children, ...rest }, ref ) {
	const { card, config } = useSelect(
		( select ) => {
			const dashboardSelect = select( 'ithemes-security/dashboard' );
			return {
				card: dashboardSelect.getDashboardCard( id ),
				config: dashboardSelect.getDashboardCardConfig( id ),
			};
		},
		[ id ]
	);

	// Use a safe default config to prevent crashes in hooks
	const safeConfig = config || { slug: '', type: '' };

	// Hooks must be called unconditionally
	const CardRender = useCardRenderer( safeConfig );
	const eqProps = useCardElementQueries( safeConfig, rest.style, gridWidth );

	if ( ! card ) {
		return null;
	}

	if ( card.card === 'unknown' ) {
		return (
			<StyledCard
				as="article"
				className={ classnames(
					className,
					'itsec-card',
					'itsec-card--unknown'
				) }
				ref={ ref }
				{ ...rest }
			>
				<CardUnknown card={ card } dashboardId={ dashboardId } />
			</StyledCard>
		);
	}

	// Card config missing - card type not available or module disabled
	const isConfigMissing = card &&
		card.card !== 'unknown' &&
		( ! config || ! CardRender );

	if ( isConfigMissing ) {
		return (
			<StyledCard
				as="article"
				className={ classnames(
					className,
					'itsec-card',
					'itsec-card--no-rendered',
					'itsec-card--module-inactive'
				) }
				ref={ ref }
				{ ...rest }
			>
				<CardModuleInactive card={ card } config={ config } dashboardId={ dashboardId } />
			</StyledCard>
		);
	}

	const FallbackView = isConfigMissing ? CardModuleInactive : CardCrash;

	return (
		<StyledCard
			as="article"
			className={ classnames( className, 'itsec-card' ) }
			id={ `itsec-card-${ card.id }` }
			ref={ ref }
			{ ...rest }
			{ ...eqProps }
		>
			<ErrorBoundary
				fallback={
					<FallbackView
						card={ card }
						config={ config }
						dashboardId={ dashboardId }
						isModuleInactive={ isConfigMissing }
					/>
				}
			>
				<CardRender
					card={ card }
					config={ config }
					dashboardId={ dashboardId }
					eqProps={ eqProps }
				/>
			</ErrorBoundary>
			{ children }
		</StyledCard>
	);
}

const Card = forwardRef( UnforwardedCard );

export default memo( Card );
