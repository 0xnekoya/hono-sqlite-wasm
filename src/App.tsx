import './App.css'
import { SQLocalDrizzle } from 'sqlocal/drizzle'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { SQLocal } from 'sqlocal'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

function App() {
  const execWithDrizzle = async () => {
    const { sql } = new SQLocal('db.sqlite3')
    await sql`CREATE TABLE groceries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`
    const items = ['bread', 'milk', 'rice']
    for (let item of items) {
      await sql`INSERT INTO groceries (name) VALUES (${item})`
    }

    const { driver } = new SQLocalDrizzle('db.sqlite3')
    const db = drizzle(driver)

    const groceries = sqliteTable('groceries', {
      id: int('id').primaryKey({ autoIncrement: true }),
      name: text('name').notNull()
    })

    // Make type-safe queries
    const data = await db
      .select({ name: groceries.name })
      .from(groceries)
      .orderBy(groceries.name)
      .all()
    console.log(data)
  }

  const downloadFile = async () => {
    const fileName = 'db.sqlite3'
    const root = await navigator.storage.getDirectory()
    if (!('values' in root) || typeof root.values !== 'function') {
      return
    }
    for await (const handle of root.values()) {
      if (handle instanceof FileSystemFileHandle) {
        const file = await handle.getFile()
        if (file.name !== fileName) {
          continue
        }
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    }
  }

  return (
    <div>
      <button onClick={() => execWithDrizzle()}>Exec Query with Drizzle</button>
      <br />
      <button onClick={() => downloadFile()}>Download SQL File</button>
    </div>
  )
}

export default App
