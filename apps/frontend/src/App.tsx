import "./App.css";
import { AppRouter } from "@/routes";
import { Providers } from "@/context/providers.tsx";

function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}

export default App;
