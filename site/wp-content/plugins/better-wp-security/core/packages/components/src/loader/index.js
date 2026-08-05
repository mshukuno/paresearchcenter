/**
 * WordPress Dependencies
 */
import { Spinner } from '@wordpress/components';
import './style.scss';

export default function Loader() {
	return (
		<div className="itsec-loader">
			<Spinner />
		</div>
	);
}
