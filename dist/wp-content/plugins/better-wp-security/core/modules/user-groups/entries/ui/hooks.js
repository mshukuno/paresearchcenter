/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Solid dependencies
 */
import { store as userGroupsStore } from '@ithemes/security.user-groups.api';
import { getAjv } from '@ithemes/security-utils';

export function useSettingsDefinitions( filters = {} ) {
	const ajv = getAjv();

	return useSelect(
		( select ) =>
			select( userGroupsStore ).getSettingDefinitions(
				ajv,
				filters
			),
		[ ajv, filters ]
	);
}
