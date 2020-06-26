import { getInfoForUser } from '../../utils'

const interactionSOMInvite = async (bot, message) => {
  const { person } = await getInfoForUser(message.user)

  if (!person) {
    throw new Error(`Couldn't find Slack ID in Airtable!`)
  }

  bot.replyPrivateDelayed(message, 'This command is stubbed')
}

export default interactionSOMInvite
