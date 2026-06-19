import React, { useEffect, useRef, useState } from 'react'
import { FiCheck, FiEye, FiHeart, FiPlay } from 'react-icons/fi'
import type { Wallpaper } from '@/common/wallpaper.interface'
import { useLazyLoad } from '../../../../hooks/use-lazy-load'
import { LuLayers, LuLayoutTemplate } from 'react-icons/lu'
import Tooltip from '@/components/toolTip'
import { HoverPlayVideo } from '../hover-play-video'
import { useLanguage } from '@/context/language.context'
import { translateWallpaperName } from '@/i18n/wallpaper-names'

interface WallpaperItemProps {
	wallpaper: Wallpaper
	selectedBackground: Wallpaper | null
	setSelectedBackground: (wallpaper: Wallpaper) => void
	onPreviewBackground: (wallpaper: Wallpaper) => void
}

function WallpaperItemFu({
	wallpaper,
	selectedBackground,
	setSelectedBackground,
	onPreviewBackground,
}: WallpaperItemProps) {
	const { t, lang } = useLanguage()
	const [loaded, setLoaded] = useState(false)
	const [error, setError] = useState(false)
	const imgRef = useRef<HTMLImageElement>(null)
	const videoRef = useRef<HTMLVideoElement>(null)
	const isSelected = selectedBackground?.id === wallpaper.id

	const loadContent = () => {
		if (wallpaper.type === 'IMAGE' && imgRef.current) {
			imgRef.current.src = wallpaper.previewSrc
		} else if (wallpaper.type === 'VIDEO' && videoRef.current) {
			videoRef.current.src = wallpaper.src
			videoRef.current.load()
		}
	}

	const elementRef = useLazyLoad(loadContent)

	const itemOutlineStyle = isSelected
		? 'ring-2 ring-primary/80 ring-offset-blue-100'
		: 'ring-1 ring-base-content/10 group-hover:ring-blue-300/70'

	useEffect(() => {
		if (loaded && videoRef.current && isSelected) {
			videoRef.current.play().catch(() => {})
		}
	}, [loaded, isSelected])

	const handleLoad = () => {
		setLoaded(true)
		setError(false)
	}

	const handleError = () => {
		setLoaded(true)
		setError(true)
	}

	// Every wallpaper is free — just apply it (no coins / purchase modal).
	const handleSelect = () => {
		if (!loaded || error) return
		setSelectedBackground(wallpaper)
	}

	const isAnimated =
		wallpaper?.type === 'VIDEO' ||
		wallpaper?.src?.endsWith('.gif') ||
		wallpaper?.previewSrc?.endsWith('.gif')

	const displayName = translateWallpaperName(wallpaper.name, lang)

	return (
		<div
			ref={elementRef}
			className={`relative rounded-xl cursor-pointer group aspect-video h-full  ${itemOutlineStyle} transition-all duration-200 active:scale-98`}
			onClick={handleSelect}
		>
			{!loaded && (
				<div className="flex items-center justify-center w-full h-full bg-gray-900/60 rounded-2xl">
					<div className="w-5 h-5 border-2 rounded-full border-blue-500/30 border-t-blue-500 animate-spin"></div>
				</div>
			)}
			{error && (
				<div className="flex flex-col items-center justify-center w-full h-full bg-red-500/10">
					<FiHeart className="text-red-400" />
					<p className="mt-2 text-xs text-gray-400">{t('wallpapers.loadError')}</p>
				</div>
			)}

			{wallpaper.type === 'IMAGE' ? (
				<img
					ref={imgRef}
					className="object-cover w-full h-full transition-opacity rounded-xl"
					style={{ opacity: loaded && !error ? 1 : 0 }}
					alt={displayName || 'Wallpaper'}
					onLoad={handleLoad}
					onError={handleError}
				/>
			) : (
				<HoverPlayVideo
					videoSrc={
						wallpaper.previewVideoSrc || wallpaper.src || wallpaper.previewSrc
					}
					posterSrc={wallpaper.previewSrc} //previewSrc is poster
					className="object-cover w-full h-full transition-opacity rounded-xl"
					style={{ opacity: loaded && !error ? 1 : 0 }}
					onLoadedData={handleLoad}
					onError={handleError}
					onClick={(e) => {
						e.stopPropagation()
						handleSelect()
					}}
				/>
			)}

			{loaded && !error && (
				<>
					{displayName && (
						<div className="absolute inset-x-0 bottom-0 flex items-center p-2 transition-opacity duration-300 rounded-xl bg-gradient-to-t from-black/80 to-black/0">
							<div className="flex-1 text-xs font-medium text-white">
								{displayName}
							</div>
						</div>
					)}
					{wallpaper.extensionUI ? (
						<div className="absolute top-0  h-5 py-0.5 px-3 rounded rounded-bl-xl rounded-r-none rounded-tr-xl w-fit bg-black/5 backdrop-blur-lg">
							<Tooltip
								content={
									wallpaper.extensionUI === 'ADVANCED'
										? t('wallpapers.suitableDefault')
										: t('wallpapers.suitableSimple')
								}
							>
								{wallpaper.extensionUI === 'SIMPLE' ? (
									<LuLayoutTemplate size={14} className="text-white/80" />
								) : (
									<LuLayers size={14} className="text-white/80" />
								)}
							</Tooltip>
						</div>
					) : null}

					{isSelected && (
						<div className="absolute p-1 text-white rounded-full shadow-sm top-2 left-2 bg-primary/80">
							<FiCheck size={12} />
						</div>
					)}

					{isAnimated && (
						<div className="absolute flex gap-0.5 px-1 rounded-t-none rounded-b-lg bg-info text-info-content shadow-sm  items-center top-0 right-0 m- inset-x-0 m-auto w-max h-4">
							<FiPlay size={12} />
							<span className="text-[10px]! font-normal">
								{t('wallpapers.animated')}
							</span>
						</div>
					)}

					<div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none group-hover:opacity-100 bg-black/10 "></div>

					{!isSelected && (
						<button
							onClick={(e) => {
								e.stopPropagation()
								onPreviewBackground(wallpaper)
							}}
							className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-white/80 hover:text-white transition-colors text-[10px] font-medium backdrop-blur-sm cursor-pointer opacity-0 group-hover:opacity-100"
						>
							<FiEye size={10} />
							<span>{t('wallpapers.preview')}</span>
						</button>
					)}
				</>
			)}
		</div>
	)
}

export const WallpaperItem = React.memo(
	WallpaperItemFu,
	(prevProps, nextProps) =>
		prevProps.wallpaper.id === nextProps.wallpaper.id &&
		prevProps.selectedBackground?.id === nextProps.selectedBackground?.id
)
