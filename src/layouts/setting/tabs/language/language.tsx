import { FiCheck } from 'react-icons/fi'
import { SectionPanel } from '@/components/section-panel'
import { useLanguage } from '@/context/language.context'
import type { Language } from '@/i18n/types'

export function LanguageTab() {
	const { lang, languages, setLanguage, t, dir } = useLanguage()

	const onSelect = (code: Language) => {
		if (code === lang) return
		setLanguage(code)
	}

	return (
		<div className="w-full max-w-xl mx-auto" dir={dir}>
			<SectionPanel title={t('settings.language.title')} size="sm">
				<div className="space-y-3">
					<p className="text-sm text-muted">{t('settings.language.description')}</p>

					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{languages.map((item) => {
							const isActive = item.code === lang
							return (
								<button
									key={item.code}
									type="button"
									onClick={() => onSelect(item.code)}
									className={`flex items-center justify-between w-full gap-3 p-3 transition-all border cursor-pointer rounded-xl ${
										isActive
											? 'border-primary/25 bg-primary/20'
											: 'bg-base-300/25 border-content hover:!border-primary/15 hover:!bg-primary/5'
									}`}
								>
									<span className="flex items-center gap-3">
										<span className="text-2xl leading-none">
											{item.flag}
										</span>
										<span className="flex flex-col items-start">
											<span className="text-sm font-medium text-content">
												{item.nativeName}
											</span>
											<span className="text-xs text-muted">
												{item.englishName}
											</span>
										</span>
									</span>
									{isActive && (
										<FiCheck size={18} className="text-primary" />
									)}
								</button>
							)
						})}
					</div>

					<p className="text-xs text-muted">{t('settings.language.hint')}</p>
				</div>
			</SectionPanel>
		</div>
	)
}
