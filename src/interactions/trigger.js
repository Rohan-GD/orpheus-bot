import octokitRequest from '@octokit/request'

import { airGet } from '../utils'
import interactionCheckinNotification from './checkinNotification'

const getAdmin = (bot, user) =>
  new Promise((resolve, reject) => {
    bot.api.users.info({ user }, (err, res) => {
      if (err) {
        console.error(err)
        reject(err)
      }
      resolve(res.user.is_owner)
    })
  })

const sendCheckinNotifications = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.toLocaleDateString('en', { weekday: 'long' })
  console.log(
    `The time is ${currentHour} on ${currentDay}. I'm going to send checkin notifications`
  )

  return airGet(
    'Clubs',
    `AND( IS_BEFORE({First Meeting Time}, TODAY()), {Checkin Hour} = '${currentHour}', {Checkin Day} = '${currentDay}', {Slack Channel ID} != '' )`
  ).then(clubs =>
    clubs.forEach(club => {
      const channel = club.fields['Slack Channel ID']

      console.log(
        `*starting checkin w/ "${club.fields['ID']}" in channel ${channel}*`
      )
      bot.replyInThread(
        message,
        `I'm reaching out to <#${channel}> (database ID \`${club.fields['ID']}\`)`
      )

      return interactionCheckinNotification(undefined, { channel })
    })
  )
}

const validateDinoisseurBadges = async () => {
  const dinoisseurBadge = await airFind('Badges', 'Name', 'Dinoisseur')
  const repoData = await octokitRequest(
    'GET /repos/:owner/:repo/stats/contributors',
    {
      owner: 'hackclub',
      repo: 'dinosaurs',
    }
  )
  const prData = await octokitRequest('GET /repos/:owner/:repo/pulls', {
    owner: 'hackclub',
    repo: 'dinosaurs',
    state: 'open',
  })

  const contributors = [
    ...repoData.data.map(node => node.author.html_url),
    ...prData.data.map(node => node.user.html_url), // submitters of open PRs are also eligible for the badge
  ]
  console.log(`I found ${contributors.length} contributors!`)

  const airtableContributors = await Promise.all(
    contributors.map(contributor =>
      airFind('People', 'GitHub URL', contributor)
    )
  )

  const recordIDs = {}
  airtableContributors
    .filter(r => r)
    .forEach(record => (recordIDs[record.id] = true))
  const uniqueRecordIDs = Object.keys(recordIDs)

  const result = await airPatch('Badges', dinoisseurBadge.id, {
    People: uniqueRecordIDs,
  })

  console.log(
    `I ended up finding ${result.fields['People'].length} who have permission to use the Dinoisseur badge.`
  )
}

const triggerInteraction = (bot, message) => {
  const { ts, channel, user } = message

  getAdmin(bot, user)
    .then(admin => {
      if (!admin) {
        bot.api.reactions.add({
          timestamp: ts,
          channel: channel,
          name: 'broken_heart',
        })
        throw new Error('user_not_leader')
      }

      console.log(
        'I can hear my heart beat in my chest... it fills me with determination'
      )
      bot.api.reactions.add({
        timestamp: ts,
        channel: channel,
        name: 'heartbeat',
      })

      return Promise.all([sendCheckinNotifications, validateDinoisseurBadges])
    })
    .catch(err => {
      console.error(err)
      bot.whisper(message, `Got error: \`${err}\``)
    })
}

export default triggerInteraction
