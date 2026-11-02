import { waitUntil } from '@vercel/functions'
import { handleChat } from '../server/chat.mjs'

export default { fetch(request) { return handleChat(request, { waitUntil }) } }
