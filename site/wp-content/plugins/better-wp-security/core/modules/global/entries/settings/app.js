/**
 * WordPress dependencies
 */
import { Button, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RjsfFieldFill } from '@ithemes/security-rjsf-theme';
import { useDetectedIp } from '@ithemes/security-hocs';
import { OnboardSiteTypeIpDetectionFill } from '@ithemes/security.pages.settings';
import './style.scss';
import { Text } from '@ithemes/ui';

function ProxyIP( { label, detectIp } ) {
	return (
		<div className="itsec-global-detected-ip">
			<Button variant="secondary" onClick={ detectIp }>
				{ __( 'Check IP', 'better-wp-security' ) }
			</Button>
			<span>{ label }</span>
		</div>
	);
}

function AuthorizedHosts( { value, onChange, ip } ) {
	const onClick = () => {
		onChange( [ ...value, ip ] );
	};

	return (
		<Button
			variant="secondary"
			onClick={ onClick }
			disabled={ ! ip }
			className="itsec-global-add-authorized-ip"
		>
			{ __( 'Authorize my IP address', 'better-wp-security' ) }
		</Button>
	);
}

function Onboard( { proxy, proxyHeader } ) {
	const { label } = useDetectedIp( proxy, proxyHeader );

	return (
		<Flex direction="column" align="start">
			<Text
				as="p"
				text={ createInterpolateElement(
					__( 'Select the configuration that causes the “Detected IP” shown below to match your current IP address. <a>Don’t know your IP?</a>', 'better-wp-security' ),
					{
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						a: <a
							href="https://go.solidwp.com/ip-checker"
							target="_blank" rel="noreferrer"
						/>,
					}
				) }
			/>

			<div className="itsec-global-detected-ip">
				<span>{ label }</span>
			</div>
		</Flex>
	);
}

export default function App() {
	const { label, detectIp, ip } = useDetectedIp();

	return (
		<>
			<RjsfFieldFill name="itsec_global_lockout_white_list">
				{ ( { formData, onChange } ) => (
					<AuthorizedHosts
						value={ formData }
						onChange={ onChange }
						ip={ ip }
					/>
				) }
			</RjsfFieldFill>
			<RjsfFieldFill name="itsec_global_proxy">
				{ () => <ProxyIP label={ label } detectIp={ detectIp } /> }
			</RjsfFieldFill>
			<OnboardSiteTypeIpDetectionFill>
				{ ( { proxy, proxyHeader } ) =>
					<Onboard proxy={ proxy } proxyHeader={ proxyHeader } />
				}
			</OnboardSiteTypeIpDetectionFill>
		</>
	);
}
