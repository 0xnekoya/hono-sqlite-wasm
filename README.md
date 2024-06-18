# Hono with SQLite WASM Sample

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

## Initial Setup

### Create hono app

```shell
bun create hono hono-sqlite-wasm
```

```txt
? Which template do you want to use? cloudflare-pages
✔ Cloning the template
? Do you want to install project dependencies? yes
? Which package manager do you want to use? bun
✔ Installing project dependencies
```

### Add React

```shell
bun add react react-dom
bun add -D @types/react @types/react-dom
```

### Install SQLite WASM

```shell
bun add @sqlite.org/sqlite-wasm
bun add @shopify/web-worker
```

Add to `vite.config.ts`

```txt
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  }
},
optimizeDeps: {
  exclude: ['@sqlite.org/sqlite-wasm']
}
```

Create `worker.ts`

Update `client.tsx` using SQLite WASM (by Web Worker)

### Install Drizzle ORM

```shell
bun add sqlocal
bun add drizzle-orm @libsql/client
```

### Reference

- [Web 上でデータベースを学習できる環境を開発する](https://zenn.dev/steelydylan/scraps/afffc39c5218ea)
