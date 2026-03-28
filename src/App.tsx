import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageSync } from './components/language-sync'
import { AppearanceProvider } from './context/appearance.context'
import { ThemeProvider } from './context/theme.context'
import { HomePage } from './pages/home'
import { PageProvider } from './context/page.context'

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
			<LanguageSync />
			<ThemeProvider>
				<AppearanceProvider>
					<PageProvider>
						<HomePage />
					</PageProvider>
				</AppearanceProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
}

export default App
