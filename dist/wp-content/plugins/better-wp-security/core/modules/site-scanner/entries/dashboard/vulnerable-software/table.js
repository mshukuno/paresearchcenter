/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Kadence dependencies
 */
import { Text } from '@ithemes/ui';

/**
 * Internal dependencies
 */
import { useGlobalNavigationUrl } from '@ithemes/security-utils';
import { PatchPriority } from '@ithemes/security-ui';
import { EmptyState } from './index';
import {
	vulnerabilityIcon,
	StyledVulnerabilityName,
	StyledVulnerabilityVersion,
	StyledVulnerabilityDetail,
	StyledVulnerability,
	StyledTableSection,
} from './styles';
import VulnerabilityStatusIcon from './vulnerability-status-icon';

export default function VulnerabilityTable( { cardData, isWide } ) {
	return (
		<StyledTableSection as="section" >
			<table className="itsec-card-vulnerable-software__table">
				<thead>
					<tr>
						<Text as="th" text={ __( 'Type', 'better-wp-security' ) } />
						<Text as="th" text={ __( 'Vulnerability', 'better-wp-security' ) } />
						<Text as="th" text={ __( 'Priority', 'better-wp-security' ) } />
						<Text as="th" text={ __( 'Status', 'better-wp-security' ) } />
						<Text as="th" text={ __( 'Date', 'better-wp-security' ) } />
						<Text as="th" text={ __( 'Action', 'better-wp-security' ) } />
					</tr>
				</thead>
				<tbody>
					{ cardData.vulnerabilities.length === 0
						? <tr>
							<td colSpan="6"><EmptyState date={ cardData.date } /></td>
						</tr>
						: cardData.vulnerabilities.map( ( vulnerability ) => (
							<VulnerabilityTableRow key={ vulnerability.id } vulnerability={ vulnerability } isWide={ isWide } />
						) ) }
				</tbody>
			</table>
		</StyledTableSection>
	);
}

function VulnerabilityTableRow( { vulnerability, isWide } ) {
	return (
		<tr>
			<td>
				<Text icon={ vulnerabilityIcon( vulnerability.software.type.slug ) } text={ vulnerability.software.type.label } />
			</td>
			<td>
				<StyledVulnerability isWide={ isWide }>
					{ vulnerability.software.type.slug !== 'wordpress' && (
						<StyledVulnerabilityName weight={ 500 } text={ vulnerability.software.label || vulnerability.software.slug } />
					) }
					<StyledVulnerabilityVersion text={ vulnerability.details.affected_in } />
					<StyledVulnerabilityDetail text={ vulnerability.details.type.label } />
				</StyledVulnerability>
			</td>
			<td>
				<PatchPriority priority={ vulnerability.details.patch_priority } score={ vulnerability.details.score } />
			</td>
			<td>
				<Text
					icon={ <VulnerabilityStatusIcon vulnerability={ vulnerability } /> }
					iconSize={ 16 }
					text={ vulnerability.resolution.label }
				/>
			</td>
			<td>
				<Text
					text={ sprintf(
						/* translators: 1. Human time diff. */
						__( '%s ago', 'better-wp-security' ),
						vulnerability.last_seen_diff
					) }
				/>
			</td>
			<td>
				<a href={ useGlobalNavigationUrl( 'vulnerabilities', `/vulnerability/${ vulnerability.id }` ) }>
					{ __( 'View Details', 'better-wp-security' ) }
				</a>
			</td>
		</tr>
	);
}
