import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "@/context/auth-context.tsx";
import { AppRouter } from "@/routes";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system">
        <AppRouter />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
