import { createRoot } from 'react-dom/client'
import { createWorkerFactory } from '@shopify/web-worker'

export const createWorker = createWorkerFactory(() => import('./worker'))
const worker = createWorker()

function App() {
  // async process by web worker
  const connectDB = async () => {
    await worker.connectDB()
    // Create Table
    await worker.exec('CREATE TABLE IF NOT EXISTS users(id INTEGER, name TEXT)')

    // Export User Data
    dumpUsers()
  }

  const execute = async () => {
    const select_max = 'SELECT max(id) as max_count FROM users'
    const max = ((await worker.selectValue(select_max)) as number) ?? 0

    // Insert row by exec
    await worker.exec({
      sql: 'insert into users values(?,?)',
      bind: [max + 1, `Alice${max + 1}`]
    })

    // Insert row by prepare & build
    const handle1 = await worker.prepare('insert into users values(?, ?)')
    const handle2 = await worker.prepare('insert into users values(?, ?)')
    await worker.binding(handle1, [max + 2, `Bob${max + 2}`])
    await worker.binding(handle2, [max + 3, `Carol${max + 3}`])
    await worker.stepFinalize(handle1)
    await worker.stepFinalize(handle2)

    // Export User Data
    dumpUsers()
  }

  const dumpUsers = async () => {
    const values = await worker.exec({
      sql: 'SELECT * FROM users',
      rowMode: 'object',
      returnValue: 'resultRows'
    })

    console.log(values)
  }

  return (
    <>
      <h1>Hello, Hono with React & SQLite WASM!</h1>
      <h2>Example</h2>
      <button onClick={() => connectDB()}>Connect DB</button>
      <button onClick={() => execute()}>Execute Query</button>
    </>
  )
}

const domNode = document.getElementById('root')!
const root = createRoot(domNode)
root.render(<App />)
