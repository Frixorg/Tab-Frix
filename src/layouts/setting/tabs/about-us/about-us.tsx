import { Trans, useTranslation } from 'react-i18next'
import { FaGithub, FaGlobe, FaHeart } from 'react-icons/fa'
import { TabFrixBrand } from '@/components/tabfrix-brand'
import { SectionPanel } from '@/components/section-panel'
import { ConfigKey } from '../../../../common/constant/config.key'

export function AboutUsTab() {
	const { t, i18n } = useTranslation()
	const dir = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'

	const getGithubCardStyle = () => {
		return 'bg-gray-800/20 border-white/5 hover:border-white/20 hover:bg-gray-800/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
	}

	const getWebsiteCardStyle = () => {
		return 'bg-indigo-900/20 border-white/5 hover:border-indigo-400/20 hover:bg-indigo-900/30 hover:shadow-[0_0_15px_rgba(129,140,248,0.2)]'
	}

	const getIconContainerStyle = (color: string) => {
		switch (color) {
			case 'gray':
				return 'bg-gray-700/50 text-gray-200'
			case 'indigo':
				return 'bg-indigo-800/50 text-indigo-200'
			default:
				return 'bg-gray-700/50 text-gray-200'
		}
	}

	const brandBody = <TabFrixBrand variant="body" />
	const brandCopyright = <TabFrixBrand variant="copyright" />

	return (
		<div className="w-full max-w-2xl mx-auto" dir={dir}>
			<div className="flex flex-col items-center p-3 text-center">
				<h1 className="mb-1">
					<TabFrixBrand variant="hero" />
				</h1>
				<div
					className={
						'inline-flex items-center px-3 py-1 mb-2 text-xs font-medium border rounded-full backdrop-blur-sm text-primary/80'
					}
				>
					<span>
						{t('settings.about.versionLabel', { version: ConfigKey.VERSION_NAME })}
					</span>
				</div>

				<p className="max-w-lg mb-2 text-sm leading-relaxed text-content">
					<Trans i18nKey="settings.about.description" components={{ brand: brandBody }} />
				</p>
			</div>

			<SectionPanel title={t('settings.about.linksTitle')} size="sm">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					<a
						href="https://github.com/Frixorg/Tab-Frix"
						target="_blank"
						rel="noopener noreferrer"
						className={`flex flex-col items-center justify-center p-4 transition-all duration-200 border rounded-xl backdrop-blur-sm hover:-translate-y-1 ${getGithubCardStyle()}`}
					>
						<div
							className={`flex items-center justify-center w-12 h-12 mb-3 rounded-full ${getIconContainerStyle('gray')}`}
						>
							<FaGithub size={24} />
						</div>
						<h3 className="text-sm font-medium text-content">{t('settings.about.githubTitle')}</h3>
						<p className="mt-1 text-xs text-center text-content">
							{t('settings.about.githubSubtitle')}
						</p>
					</a>

					<a
						href="https://imblackline-nuxt.vercel.app/"
						target="_blank"
						rel="noopener noreferrer"
						className={`flex flex-col items-center justify-center p-4 transition-all duration-200 border rounded-xl backdrop-blur-sm hover:-translate-y-1 ${getWebsiteCardStyle()}`}
					>
						<div
							className={`flex items-center justify-center w-12 h-12 mb-3 rounded-full ${getIconContainerStyle('indigo')}`}
						>
							<FaGlobe size={24} />
						</div>
						<h3 className="text-sm font-medium text-content">{t('settings.about.websiteTitle')}</h3>
						<p className="mt-1 text-xs text-center text-content">
							{t('settings.about.websiteSubtitle')}
						</p>
					</a>
				</div>
			</SectionPanel>

			<div className="flex items-center justify-center gap-1 mt-8 text-sm text-content opacity-75 flex-wrap">
				<span>{t('settings.about.madeWith')}</span>
				<FaHeart className="text-red-500 animate-pulse shrink-0" size={14} aria-hidden />
			</div>

			<div className="mt-2 mb-4 text-xs text-center text-content opacity-55">
				<Trans i18nKey="settings.about.copyright" components={{ brand: brandCopyright }} />
			</div>
		</div>
	)
}
