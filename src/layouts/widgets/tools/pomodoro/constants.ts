import type { TimerMode } from './types'

export const modeLabels: Record<TimerMode, string> = {
	work: 'widgets.pomodoro.modeWork',
	'short-break': 'widgets.pomodoro.modeShort',
}

export const modeFullLabels: Record<TimerMode, string> = {
	work: 'widgets.pomodoro.modeWorkFull',
	'short-break': 'widgets.pomodoro.modeShortFull',
}
