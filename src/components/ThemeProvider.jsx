import { createContext, useContext, useEffect, useState } from "react"

const DEFAULT_THEME = "dark"
// Renamed with the 2026 redesign so every visitor starts in the default theme once, whatever the old site saved.
const DEFAULT_STORAGE_KEY = "coasts-theme"

const ThemeContext = createContext({
    theme: DEFAULT_THEME,
    setTheme: () => null,
})

export function ThemeProvider({
    children,
    defaultTheme = DEFAULT_THEME,
    storageKey = DEFAULT_STORAGE_KEY,
    ...props
}) {
    const [theme, setTheme] = useState(
        () => (localStorage.getItem(storageKey)) || defaultTheme
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeContext.Provider {...props} value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
