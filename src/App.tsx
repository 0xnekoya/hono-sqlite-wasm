import './App.css'

const worker = new ComlinkWorker<typeof import('./worker')>(
  new URL('./worker', import.meta.url)
)

function App() {
  // async process by comlink(web worker)
  const connectDB = async () => {
    await worker.connectDB()
    // Create table
    await worker.exec('CREATE TABLE IF NOT EXISTS users(id INTEGER, name TEXT)')

    // Export user data
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

    // Insert row by prepare & bind
    const handle1 = await worker.prepare('insert into users values(?, ?)')
    const handle2 = await worker.prepare('insert into users values(?, ?)')
    await worker.binding(handle1, [max + 2, `Bob${max + 2}`])
    await worker.binding(handle2, [max + 3, `Carol${max + 3}`])
    await worker.stepFinalize(handle1)
    await worker.stepFinalize(handle2)

    // Export user data
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

  const downloadFile = async () => {
    const opfsRoot = await navigator.storage.getDirectory()
    console.log(opfsRoot)
    const fileHandle = await opfsRoot.getFileHandle('/mydb.sqlite3', {
      create: true
    })
    const file = await fileHandle.getFile()
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <button onClick={() => connectDB()}>Create DB</button>
      <br />
      <button onClick={() => execute()}>Exec Query</button>
      <br />
      <button onClick={() => downloadFile()}>Download SQL File</button>
    </div>
  )
}

export default App
