import { readFile } from 'node:fs/promises'
import { queryD1 } from '../server/chat-log.mjs'

const command = process.argv[2]
try {
  if (command === 'init') {
    const sql = await readFile(new URL('../migrations/d1/0001_chat_turns.sql', import.meta.url), 'utf8')
    for (const statement of sql.split(';').map(value => value.trim()).filter(Boolean))
      await queryD1(process.env, statement)
    console.log('Chat tables are ready.')
  }
  else if (command === 'list') {
    const result = await queryD1(process.env, 'SELECT * FROM chat_turns ORDER BY started_at DESC LIMIT 50')
    console.log(JSON.stringify(result[0].results, null, 2))
  }
  else {
    throw new Error('Usage: node --env-file-if-exists=.env.local scripts/chat-d1.mjs init|list')
  }
}
catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
