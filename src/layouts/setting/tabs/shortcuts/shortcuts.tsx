import { SectionPanel } from '@/components/section-panel'
import React from 'react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/language.context'

interface Shortcut {
	id: string
	windowsKey: string
	macKey: string
	descriptionKey: string
	categoryKey: string
}

// Helper function to format keyboard shortcuts
const formatShortcut = (shortcutText: string) => {
	return shortcutText.split('+').map((key, index, array) => (
		<React.Fragment key={index}>
			<kbd className="kbd">{key.trim()}</kbd>
			{index < array.length - 1 && ' + '}
		</React.Fragment>
	))
}

export function ShortcutsTab() {
	const { t, dir } = useLanguage()
	const [isMac, setIsMac] = useState(false)

	useEffect(() => {
		const ua = navigator.userAgent
		setIsMac(/Mac|iPod|iPhone|iPad/.test(ua))
	}, [])
	const shortcuts: Shortcut[] = [
		{
			id: 'open_bookmark_new_tab',
			windowsKey: 'CTRL + Left-click',
			macKey: '⌘ + Left-click',
			descriptionKey: 'settings.shortcuts.items.openBookmarkNewTab',
			categoryKey: 'settings.shortcuts.categories.bookmarks',
		},
		{
			id: 'open_bookmark_middle_click',
			windowsKey: 'Middle-click',
			macKey: 'Middle-click',
			descriptionKey: 'settings.shortcuts.items.openBookmarkMiddle',
			categoryKey: 'settings.shortcuts.categories.bookmarks',
		},
		{
			id: 'open_all_bookmarks',
			windowsKey: 'CTRL + Left-click',
			macKey: '⌘ + Left-click',
			descriptionKey: 'settings.shortcuts.items.openAllBookmarks',
			categoryKey: 'settings.shortcuts.categories.bookmarks',
		},
		{
			id: 'toggle_theme',
			windowsKey: 'CTRL + ALT + T',
			macKey: '⌘ + ALT + T',
			descriptionKey: 'settings.shortcuts.items.toggleTheme',
			categoryKey: 'settings.shortcuts.categories.appearance',
		},
		{
			id: 'toggle_ui',
			windowsKey: 'CTRL + ALT + Y',
			macKey: '⌘ + ALT + Y',
			descriptionKey: 'settings.shortcuts.items.toggleUI',
			categoryKey: 'settings.shortcuts.categories.appearance',
		},
	]

	const categories = shortcuts.reduce(
		(acc, shortcut) => {
			if (!acc[shortcut.categoryKey]) {
				acc[shortcut.categoryKey] = []
			}
			acc[shortcut.categoryKey].push(shortcut)
			return acc
		},
		{} as Record<string, Shortcut[]>
	)
	return (
		<div className="w-full max-w-xl mx-auto" dir={dir}>
			<SectionPanel title={t('settings.shortcuts.title')} delay={0.1}>
				<div className="space-y-5">
					<p className="text-muted">{t('settings.shortcuts.description')}</p>

					{Object.entries(categories).map(([categoryKey, categoryShortcuts]) => (
						<div key={categoryKey} className="mb-6">
							<h3 className={'text-base font-medium mb-3 text-content'}>
								{t(categoryKey)}
							</h3>
							<div className="space-y-2">
								{categoryShortcuts.map((shortcut) => (
									<div
										key={shortcut.id}
										className={
											'flex items-center justify-between p-3 rounded-lg border border-content'
										}
									>
										<span className={'text-content'}>
											{t(shortcut.descriptionKey)}
										</span>
										<div
											className={'px-3 py-1 text-sm font-mono'}
											dir="ltr"
										>
											{formatShortcut(
												isMac
													? shortcut.macKey
													: shortcut.windowsKey
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
