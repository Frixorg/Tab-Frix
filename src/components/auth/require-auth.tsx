import type { ReactNode } from 'react'

interface RequireAuthProps {
	children: ReactNode
	fallback?: ReactNode
	mode?: 'block' | 'preview'
}

// Login gates removed — every section is available without signing in. This
// wrapper now simply renders its children (props kept for call-site compatibility).
export const RequireAuth = ({ children }: RequireAuthProps) => {
	return <>{children}</>
}
