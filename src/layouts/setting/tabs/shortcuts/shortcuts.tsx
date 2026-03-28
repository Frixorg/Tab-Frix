import { useEffect, useMemo, useState } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SectionPanel } from '@/components/section-panel'

type ShortcutCategory = 'bookmarks' | 'appearance'

interface ShortcutDef {
	id: string
	windowsKey: string
	macKey: string
	category: ShortcutCategory
}

const SHORTCUT_DEFS: ShortcutDef[] = [
	{
		id: 'open_bookmark_new_tab',
		windowsKey: 'CTRL + Left-click',
		macKey: '⌘ + Left-click',
		category: 'bookmarks',
	},
	{
		id: 'open_bookmark_middle_click',
		windowsKey: 'Middle-click',
		macKey: 'Middle-click',
		category: 'bookmarks',
	},
	{
		id: 'open_all_bookmarks',
		windowsKey: 'CTRL + Left-click',
		macKey: '⌘ + Left-click',
		category: 'bookmarks',
	},
	{
		id: 'toggle_theme',
		windowsKey: 'CTRL + ALT + T',
		macKey: '⌘ + ALT + T',
		category: 'appearance',
	},
	{
		id: 'toggle_ui',
		windowsKey: 'CTRL + ALT + Y',
		macKey: '⌘ + ALT + Y',
		category: 'appearance',
	},
]

const CATEGORY_ORDER: ShortcutCategory[] = ['bookmarks', 'appearance']

const formatShortcut = (shortcutText: string) => {
	return shortcutText.split('+').map((key, index, array) => (
		<React.Fragment key={index}>
			<kbd className="kbd">{key.trim()}</kbd>
			{index < array.length - 1 && ' + '}
		</React.Fragment>
	))
}

export function ShortcutsTab() {
	const { t, i18n } = useTranslation()
	const [isMac, setIsMac] = useState(false)

	useEffect(() => {
		const ua = navigator.userAgent
		setIsMac(/Mac|iPod|iPhone|iPad/.test(ua))
	}, [])

	const grouped = useMemo(() => {
		const withDescriptions = SHORTCUT_DEFS.map((def) => ({
			...def,
			description: t(`settings.shortcuts.items.${def.id}`),
		}))

		return CATEGORY_ORDER.map((cat) => ({
			id: cat,
			title: t(`settings.shortcuts.categories.${cat}`),
			items: withDescriptions.filter((s) => s.category === cat),
		})).filter((g) => g.items.length > 0)
	}, [t, i18n.language])

	const dir = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'

	return (
		<div className="w-full max-w-xl mx-auto" dir={dir}>
			<SectionPanel title={t('settings.shortcuts.title')} delay={0.1}>
				<div className="space-y-5">
					<p className="text-muted">{t('settings.shortcuts.intro')}</p>

					{grouped.map((group) => (
						<div key={group.id} className="mb-6">
							<h3 className="text-base font-medium mb-3 text-content">
								{group.title}
							</h3>
							<div className="space-y-2">
								{group.items.map((shortcut) => (
									<div
										key={shortcut.id}
										className="flex items-center justify-between p-3 rounded-lg border border-content gap-3"
									>
										<span className="text-content">{shortcut.description}</span>
										<div className="px-3 py-1 text-sm font-mono shrink-0" dir="ltr">
											{formatShortcut(
												isMac ? shortcut.macKey : shortcut.windowsKey
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</SectionPanel>
		</div>
	)
}
