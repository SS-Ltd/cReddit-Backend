const UserModel = require('../models/User')
const CommunityModel = require('../models/Community')
const { sendMessage } = require('../utils/Message')

const inviteModerator = async (req, res) => {
  try {
    const { username } = req.body
    const { communityName } = req.params
    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    const user = await UserModel.findOne({ username, isDeleted: false })
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })

    if (!user || !loggedInUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }
    if (!community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator' })
    }
    if (community.moderators.includes(user.username)) {
      return res.status(400).json({ message: 'User is already a moderator' })
    }
    if (community.invitations.includes(user.username)) {
      return res.status(400).json({ message: 'User has already been invited' })
    }

    community.invitations.push(user.username)

    await community.save()
    sendMessage(community.owner, user.username, `invitation to moderate /r/${community.name}`, `gadzooks! you are invited to become a moderator of /r/${community.name} to accept, visit the moderators page for /r/${community.name} and click "accept". otherwise, if you did not expect to receive this, you can simply ignore this invitation or report it.`, user.preferences.invitationNotifs || true)

    res.status(200).json({ message: 'Moderator invitation sent' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const acceptInvitation = async (req, res) => {
  try {
    const { communityName } = req.params
    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })

    if (!loggedInUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }
    if (!community.invitations.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You have not been invited to moderate this community' })
    }

    community.invitations = community.invitations.filter(invitation => invitation !== loggedInUser.username)
    community.moderators.push(loggedInUser.username)

    await community.save()
    sendMessage(community.owner, loggedInUser.username, 'moderator added', `/u/${loggedInUser.username} has accepted an invitation to become moderator of /r/${community.name}.`, loggedInUser.preferences.invitationNotifs || true)

    res.status(200).json({ message: 'Moderator invitation accepted' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const rejectInvitation = async (req, res) => {
  try {
    const { communityName } = req.params
    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })

    if (!loggedInUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }
    if (!community.invitations.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You have not been invited to moderate this community' })
    }

    community.invitations = community.invitations.filter(invitation => invitation !== loggedInUser.username)

    await community.save()

    res.status(200).json({ message: 'Moderator invitation rejected' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const leaveModeration = async (req, res) => {
  try {
    const { communityName } = req.params
    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })

    if (!loggedInUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }
    if (!community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator of this community' })
    }

    community.moderators = community.moderators.filter(moderator => moderator !== loggedInUser.username)

    await community.save()

    res.status(200).json({ message: 'Moderator left' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const removeModerator = async (req, res) => {
  try {
    const { username } = req.body
    const { communityName } = req.params
    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    const user = await UserModel.findOne({ username, isDeleted: false })
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })

    if (!user || !loggedInUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }
    if (!community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator' })
    }
    if (!community.moderators.includes(user.username)) {
      return res.status(400).json({ message: 'User is already not a moderator' })
    }

    community.moderators = community.moderators.filter(moderator => moderator !== user.username)

    await community.save()

    res.status(200).json({ message: 'Moderator removed' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

module.exports = {
  inviteModerator,
  acceptInvitation,
  rejectInvitation,
  leaveModeration,
  removeModerator
}
