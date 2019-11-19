import { initBot, transcript } from '../utils'

const BOT_SPAM_CHANNEL = 'C0P5NE354'

const interactionStartup = (bot = initBot(), message) => {
  bot.say({
    text: transcript('startup.message'),
    channel: BOT_SPAM_CHANNEL,
  })
}

export default interactionStartup
