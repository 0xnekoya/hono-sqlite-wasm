import sqlite3InitModule, {
  Database,
  Sqlite3Static,
  FlexibleString,
  PreparedStatement,
  BindingSpec
} from '@sqlite.org/sqlite-wasm'

const log = (...args: any[]) => console.log(...args)
const error = (...args: any[]) => console.error(...args)

let db: Database | null = null

/**
 * Initialize & connect to DB
 * @returns Database
 */
export const connectDB = async (): Promise<Database> => {
  if (db) {
    return db
  }

  log('Loading and initializing SQLite3 module...')

  try {
    // Initialize sqlite3
    const sqlite3 = await sqlite3InitModule({
      print: log,
      printErr: error
    })

    // connect to DB
    db = openDB(sqlite3)

    return db
  } catch (err: unknown) {
    if (err instanceof Error) {
      error(err.name, err.message)
      throw err
    }
  }

  throw new Error('unknown error')
}

/**
 * Connect to sqlite3 & create database
 * ・https://sqlite.org/wasm/doc/tip/api-oo1.md
 * @param sqlite3
 * @returns
 */
const openDB = (sqlite3: Sqlite3Static) => {
  log('Running SQLite3 version', sqlite3.version.libVersion)

  // If opfs is available, create OpfsDb
  if ('opfs' in sqlite3) {
    // (c: create if it does not exist, t: trace on)
    db = new sqlite3.oo1.OpfsDb('/mydb.sqlite3', 'ct')
    log('OPFS is available, created persisted database at', db.filename)
  } else {
    db = new sqlite3.oo1.DB('/mydb.sqlite3', 'ct')
    log('OPFS is not available, created transient database', db.filename)
  }

  return db
}

/**
 * exec wrapper function
 * @param sql
 * @param opts
 * @returns
 */
export const exec = (sql: any, opts: any = {}): Database => {
  if (!db) {
    throw new Error()
  }

  if ('string' === typeof sql) {
    return db.exec(sql, opts)
  } else {
    return db.exec(sql)
  }
}

/**
 * get value by select query
 * @param sql
 * @param bind
 * @param asType
 * @returns
 */
export const selectValue = (
  sql: FlexibleString,
  bind?: BindingSpec,
  asType?: any
): unknown => {
  if (!db) {
    throw new Error()
  }

  return db.selectValue(sql, bind, asType)
}

/**
 * Database::prepare() returns a Statement but cannot be passed to the main UI thread side
 * (the value is passed serialized, but no method call can be made from the UI thread)
 * So, keep the Statement in the objectStore,
 * return a key (pointer) to the main UI thread side to get the value
 * (On the UI thread side, the variable name "handle" is used to clarify the role)
 */
const objectStore: {
  [key: number]: object
} = {}

/**
 * prepare wrapper function
 * @param sql
 * @returns
 */
export const prepare = (sql: FlexibleString): number => {
  if (!db) {
    throw new Error()
  }
  const stmt = db.prepare(sql)
  const handle = stmt.pointer as number
  objectStore[handle] = stmt
  return handle
}

/**
 * PreparedStatement::bind() wrapper function
 * @param handle
 * @param binding
 * @returns
 */
export const binding = (handle: number, binding: BindingSpec): number => {
  if (!db) {
    throw new Error()
  }

  const stmt = objectStore[handle] as PreparedStatement
  stmt.bind(binding)
  return handle
}

/**
 * PreparedStatement::stepFinalize() wrapper function
 * @param handle
 * @returns
 */
export const stepFinalize = (handle: number): boolean => {
  if (!db) {
    throw new Error()
  }

  const stmt = objectStore[handle] as PreparedStatement
  return stmt.stepFinalize()
}
