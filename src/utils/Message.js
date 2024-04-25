const MessageModel = require('../models/Message')
const UserModel = require('../models/User')
const CommunityModel = require('../models/Community')

const sendMessage = async (sender, receiver, subject, text) => {
  const senderUser = await UserModel.findOne({ username: sender })
  if (receiver.startsWith('/r/')) {
    const communityName = receiver.slice(3)
    const community = CommunityModel.findOne({ name: communityName })

    if (!community) {
      throw new Error('Community not found')
    }

    if (community.bannedUsers.includes(senderUser.username)) {
      throw new Error('User is banned from community')
    }

    if (community.mutedUsers.includes(senderUser.username)) {
      throw new Error('User is muted in community')
    }

    const moderators = community.moderators

    moderators.forEach(moderator => {
      sendMessage(sender, moderator, subject, text)
    })
  } else {
    const receiverUser = await UserModel.findOne({ username: receiver })

    if (!receiverUser || !senderUser) {
      throw new Error('User not found')
    }

    if (receiverUser.blockedUsers.includes(senderUser.username)) {
      throw new Error('Unable to send message to blocked user')
    }

    const message = new MessageModel({
      from: senderUser.username,
      to: receiverUser.username,
      subject: subject,
      text: text
    })

    await message.save()
  }
}

module.exports = {
  sendMessage
}
