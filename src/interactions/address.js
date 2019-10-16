import { getInfoForUser, text } from '../utils'

const interactionAddress = (bot, message) => {
  // check that they're a user
  const { user } = message

  getInfoForUser(user).then(({ leader, leaderAddress }) => {
    if (!leader) {
      throw new Error('Command can only be run by leaders!')
    }

    bot.replyPrivateDelayed(
      message,
      text('address', { address: leaderAddress.fields })
    )
  })
}

export default interactionAddress