import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from './components/ui/button'
import { ThemeProvider } from './components/theme-provider'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ThemeProvider defaultTheme='system'>

        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1 className="bg-red-500">Vite + React</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <Button>iiii</Button>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </ThemeProvider>
    </>
  )
}

export default App
