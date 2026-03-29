import { useEffect, useState, type HTMLAttributes } from 'react'

type TabFrixVariant = 'hero' | 'sidebar' | 'body' | 'copyright'

export interface TabFrixBrandProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: TabFrixVariant
}

const tabClassByVariant: Record<TabFrixVariant, string> = {
	hero: 'text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 font-bold',
	sidebar: 'text-muted font-medium',
	body: 'text-content font-medium',
	copyright: 'text-content font-medium',
}

const frixClassByVariant: Record<TabFrixVariant, string> = {
	hero: 'text-3xl font-bold',
	sidebar: 'text-xs font-medium',
	body: 'text-sm font-medium',
	copyright: 'text-xs font-medium',
}

export function TabFrixBrand({ variant = 'hero', className = '', ...rest }: TabFrixBrandProps) {
	const [isGlitching, setIsGlitching] = useState(false)

	useEffect(() => {
		let cancelled = false
		const timeouts: ReturnType<typeof setTimeout>[] = []
		const schedule = (fn: () => void, ms: number) => {
			const id = window.setTimeout(() => {
				if (!cancelled) fn()
			}, ms)
			timeouts.push(id)
		}

		const triggerGlitch = () => {
			if (cancelled) return
			setIsGlitching(true)
			schedule(() => {
				if (cancelled) return
				setIsGlitching(false)
				const nextDelay = Math.random() * (3000 - 500) + 500
				schedule(triggerGlitch, nextDelay)
			}, 300)
		}

		const initialDelay = Math.random() * (3000 - 500) + 500
		schedule(triggerGlitch, initialDelay)

		return () => {
			cancelled = true
			for (const id of timeouts) clearTimeout(id)
		}
	}, [])

	const tabCls = tabClassByVariant[variant]
	const frixCls = frixClassByVariant[variant]

	return (
		<span className={`inline-flex items-baseline whitespace-nowrap ${className}`} {...rest}>
			<span className={tabCls}>Tab</span>
			<span
				className={`glitch-frix ${frixCls} ${isGlitching ? 'is-glitching' : ''}`}
				data-text="Frix"
			>
				Frix
			</span>
		</span>
	)
}
