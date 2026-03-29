import type { JSX } from 'react'
import { FaGithub } from 'react-icons/fa'
import GoogleCalendar from '@/assets/google-calendar.png'

export type PlatformLocaleKey = 'google' | 'github'

export interface PlatformStaticConfig {
	id: string
	localeKey: PlatformLocaleKey
	bgColor: string
	isActive: boolean
	icon: JSX.Element
	isOptionalPermissions?: boolean
}

export const PLATFORM_STATIC_CONFIGS: PlatformStaticConfig[] = [
	{
		id: 'google',
		localeKey: 'google',
		bgColor: '',
		isActive: true,
		icon: (
			<img src={GoogleCalendar} alt="" className="w-8 h-8 rounded-sm" />
		),
		isOptionalPermissions: true,
	},
	{
		id: 'github',
		localeKey: 'github',
		bgColor: 'bg-gray-800',
		isActive: false,
		icon: <FaGithub size={20} className="text-white" />,
	},
]
