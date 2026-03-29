import {
	getOffsetLabelForIana,
	type FetchedTimezone,
} from '@/services/hooks/timezone/getTimezones.hook'

export function buildTimezoneFromIana(
	iana: string,
	zones: FetchedTimezone[]
): FetchedTimezone {
	const offset = getOffsetLabelForIana(iana)
	const found = zones.find((z) => z.value === iana)
	if (found) {
		return { ...found, offset }
	}
	return {
		label: iana.replace(/\//g, ' / ').replace(/_/g, ' '),
		value: iana,
		offset,
	}
}
