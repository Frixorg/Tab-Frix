import { useTranslation } from 'react-i18next'
import { RiArrowLeftSLine } from 'react-icons/ri'
import type { FolderPathItem } from '../types/bookmark.types'

type FolderPathProps = {
	folderPath: FolderPathItem[]
	onNavigate: (folderId: string | null, depth: number) => void
	className?: string
}

export function FolderPath({ folderPath, onNavigate, className }: FolderPathProps) {
	const { t } = useTranslation()

	if (folderPath.length === 0) return null

	return (
		<nav
			aria-label="Folder navigation"
			className={`flex w-fit max-w-full items-center px-4 py-2 text-xs rounded ${className ?? ''}`}
		>
			<ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
				<li>
					<button
						type="button"
						onClick={() => onNavigate(null, -1)}
						className={
							'cursor-pointer transition-colors text-content opacity-70 hover:opacity-100'
						}
						aria-label={t('common.back')}
					>
						{t('common.back')}
					</button>
				</li>

				{folderPath.map((item, index) => (
					<li key={item.id} className="flex items-center gap-1">
						<RiArrowLeftSLine
							className="shrink-0 text-content ltr:rotate-180"
							size={14}
							aria-hidden
						/>
						<button
							type="button"
							onClick={() => onNavigate(item.id, index)}
							className={
								'cursor-pointer transition-colors text-blue-400 hover:text-blue-300'
							}
							aria-label={item.title}
						>
							{item.title}
						</button>
					</li>
				))}
			</ol>
		</nav>
	)
}
