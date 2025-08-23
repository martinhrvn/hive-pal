import './App.css';
import { AppRouter } from '@/routes';
import { Providers } from '@/context/providers.tsx';
import { Toaster } from 'sonner';

function App() {
  return (
    <Providers>
      <AppRouter />
      <Toaster />
    </Providers>
  );
}

export default App;
