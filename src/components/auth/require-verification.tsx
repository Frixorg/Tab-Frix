import type { ReactNode } from 'react'

interface RequireVerificationProps {
	children: ReactNode
	fallback?: ReactNode
	mode?: 'block' | 'preview'
}

export const RequireVerification = ({
	children,
}: RequireVerificationProps) => {
	// Auth removed: always render children
	return <>{children}</>
}
