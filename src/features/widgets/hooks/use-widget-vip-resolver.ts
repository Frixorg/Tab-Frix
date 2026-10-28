import { useCallback, useMemo } from 'react'
import { useGetWidgetCatalog } from '@/services/widgets/widget-catalog.hook'
import { getWidgetRegistry } from '../registry'

const DEFAULT_MAX_FREE_WIDGETS = 5

export function useWidgetVipResolver(enabled = true) {
	const { data: serverCatalog } = useGetWidgetCatalog(enabled)

	const maxFreeWidgets =
		serverCatalog?.config?.maxFreeWidgets ?? DEFAULT_MAX_FREE_WIDGETS

	const isWidgetVipOnly = useCallback(
		(widgetKey?: string): boolean => {
			if (!widgetKey) return false
			const serverItem = serverCatalog?.widgets?.find(
				(w) => w.widgetKey === widgetKey
			)
			if (serverItem) {
				return Boolean(serverItem.isVipOnly)
			}
			const localDef = getWidgetRegistry()[widgetKey]
			return Boolean(localDef?.isVipOnly)
		},
		[serverCatalog]
	)

	const isVariantVipOnly = useCallback(
		(widgetKey?: string, variantId?: string): boolean => {
			if (!widgetKey || !variantId) return false
			const serverItem = serverCatalog?.widgets?.find(
				(w) => w.widgetKey === widgetKey
			)
			if (serverItem?.variants) {
				const v = serverItem.variants.find(
					(item) => item.id === variantId || item.meta?.variant === variantId
				)
				if (v) {
					return Boolean(v.isVipOnly)
				}
			}
			const localDef = getWidgetRegistry()[widgetKey]
			const localVariant = localDef?.variants?.find(
				(item) => item.id === variantId || item.meta?.variant === variantId
			)
			return Boolean(localVariant?.isVipOnly)
		},
		[serverCatalog]
	)

	const isSizeVipOnly = useCallback(
		(_widgetKey?: string, _size?: { w: number; h: number }): boolean => false,
		[]
	)

	const isWidgetNew = useCallback(
		(widgetKey?: string): boolean => {
			if (!widgetKey) return false
			const serverItem = serverCatalog?.widgets?.find(
				(w) => w.widgetKey === widgetKey
			)
			return Boolean(serverItem?.isNew)
		},
		[serverCatalog]
	)

	const featuredWidgetKeys = useMemo(
		() => serverCatalog?.config?.featuredWidgetKeys ?? [],
		[serverCatalog]
	)

	return useMemo(
		() => ({
			serverWidgets: serverCatalog?.widgets,
			maxFreeWidgets,
			featuredWidgetKeys,
			isWidgetVipOnly,
			isVariantVipOnly,
			isSizeVipOnly,
			isWidgetNew,
		}),
		[
			serverCatalog,
			maxFreeWidgets,
			featuredWidgetKeys,
			isWidgetVipOnly,
			isVariantVipOnly,
			isSizeVipOnly,
			isWidgetNew,
		]
	)
}
