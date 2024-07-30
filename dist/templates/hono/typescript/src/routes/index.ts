import { Hono } from 'hono'

const routes = new Hono()

routes.get('/', (c) => {
  return c.json({ message: 'Welcome to the API' })
})

routes.get('/health', (c) => {
  return c.json({ status: 'OK' })
})

export default routes
