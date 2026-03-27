import type { ReactNode } from 'react'

interface RequireAuthProps {
	children: ReactNode
	fallback?: ReactNode
	mode?: 'block' | 'preview'
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
	// Auth removed: always render children
	return <>{children}</>
}
