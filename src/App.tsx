import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppearanceProvider } from './context/appearance.context'
import { AuthProvider } from './context/auth.context'
import { LanguageProvider } from './context/language.context'
import { ThemeProvider } from './context/theme.context'
import { PageProvider } from './context/page.context'
import { RootLayout } from './pages/root'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
		},
	},
})

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<LanguageProvider>
				<AuthProvider>
					<ThemeProvider>
						<AppearanceProvider>
							<PageProvider>
								<RootLayout />
							</PageProvider>
						</AppearanceProvider>
					</ThemeProvider>
				</AuthProvider>
			</LanguageProvider>
		</QueryClientProvider>
	)
}

export default App
