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
    loggedInUser.moderatorInCommunities.push(community.name)

    await community.save()
    await loggedInUser.save()
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
    loggedInUser.moderatorInCommunities = loggedInUser.moderatorInCommunities.filter(community => communityName !== community)

    await community.save()
    await loggedInUser.save()

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
    user.moderatorInCommunities = user.moderatorInCommunities.filter(community => communityName !== community)

    await community.save()
    await user.save()

    res.status(200).json({ message: 'Moderator removed' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const banUser = async (req, res) => {
  try {
    const { username, rule, modNote } = req.body
    const { communityName } = req.params
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      return res.status(400).json({ message: 'Community does not exist' })
    }

    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    if (!loggedInUser.moderatorInCommunities.includes(communityName) || !community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator of this community' })
    }

    const userToBan = await UserModel.findOne({ username, isDeleted: false })
    if (!userToBan) {
      return res.status(400).json({ message: 'User does not exist' })
    }

    if (community.bannedUsers.find(u => u.name === userToBan.username)) {
      return res.status(400).json({ message: 'User is already banned' })
    }

    if (community.moderators.includes(userToBan.username)) {
      return res.status(400).json({ message: 'You cannot ban a moderator' })
    }

    if (community.rules.find(r => r.text === rule) === undefined) {
      return res.status(400).json({ message: 'Rule does not exist' })
    }

    const note = modNote || null
    community.bannedUsers.push({ name: userToBan.username, reasonToBan: rule, modNote: note })
    userToBan.bannedInCommunities.push(community.name)

    await userToBan.save()
    await community.save()
    res.status(200).json({ message: 'User banned' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const unbanUser = async (req, res) => {
  try {
    const { username } = req.body
    const { communityName } = req.params
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      return res.status(400).json({ message: 'Community does not exist' })
    }

    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    if (!loggedInUser.moderatorInCommunities.includes(communityName) || !community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator of this community' })
    }

    const userToUnban = await UserModel.findOne({ username, isDeleted: false })
    if (!userToUnban) {
      return res.status(400).json({ message: 'User does not exist' })
    }

    if (community.bannedUsers.find(u => u.name === userToUnban.username) === undefined) {
      return res.status(400).json({ message: 'User is not banned' })
    }

    community.bannedUsers = community.bannedUsers.filter(bannedUser => bannedUser.name !== userToUnban.username)
    userToUnban.bannedInCommunities = userToUnban.bannedInCommunities.filter(community => communityName !== community)

    await userToUnban.save()
    await community.save()
    res.status(200).json({ message: 'User unbanned' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const approveUser = async (req, res) => {
  try {
    const { username } = req.body
    const { communityName } = req.params
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      return res.status(400).json({ message: 'Community does not exist' })
    }

    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    if (!loggedInUser) {
      return res.status(400).json({ message: 'Moderator does not exist' })
    }

    if (!loggedInUser.moderatorInCommunities.includes(communityName) || !community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator of this community' })
    }

    const userToApprove = await UserModel.findOne({ username, isDeleted: false })
    if (!userToApprove) {
      return res.status(400).json({ message: 'User does not exist' })
    }

    if (community.approvedUsers.includes(userToApprove.username) && userToApprove.approvedInCommunities.includes(communityName)) {
      return res.status(400).json({ message: 'User is already approved' })
    }

    community.approvedUsers.push(userToApprove.username)
    userToApprove.approvedInCommunities.push(communityName)

    await community.save()
    await userToApprove.save()

    return res.status(200).json({ message: 'User approved' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const getBannedUsers = async (req, res) => {
  try {
    const { communityName } = req.params
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      return res.status(400).json({ message: 'Community does not exist' })
    }

    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    if (!loggedInUser.moderatorInCommunities.includes(communityName) || !community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator of this community' })
    }

    res.status(200).json({ bannedUsers: community.bannedUsers })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const unapproveUser = async (req, res) => {
  try {
    const { username } = req.body
    const { communityName } = req.params
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      return res.status(400).json({ message: 'Community does not exist' })
    }

    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    if (!loggedInUser) {
      return res.status(400).json({ message: 'Moderator does not exist' })
    }

    if (!loggedInUser.moderatorInCommunities.includes(communityName) || !community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator of this community' })
    }

    const userToUnapprove = await UserModel.findOne({ username, isDeleted: false })
    if (!userToUnapprove) {
      return res.status(400).json({ message: 'User does not exist' })
    }

    if (!community.approvedUsers.includes(userToUnapprove.username) && !userToUnapprove.approvedInCommunities.includes(communityName)) {
      return res.status(400).json({ message: 'User is not approved' })
    }

    community.approvedUsers = community.approvedUsers.filter(approvedUser => approvedUser !== userToUnapprove.username)
    userToUnapprove.approvedInCommunities = userToUnapprove.approvedInCommunities.filter(community => communityName !== community)

    await community.save()
    await userToUnapprove.save()

    return res.status(200).json({ message: 'User unapproved' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

const getApprovedUsers = async (req, res) => {
  try {
    const { communityName } = req.params
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      return res.status(400).json({ message: 'Community does not exist' })
    }

    const loggedInUser = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
    if (!loggedInUser) {
      return res.status(400).json({ message: 'Moderator does not exist' })
    }

    if (!loggedInUser.moderatorInCommunities.includes(communityName) || !community.moderators.includes(loggedInUser.username)) {
      return res.status(400).json({ message: 'You are not a moderator of this community' })
    }

    res.status(200).json(community.approvedUsers)
  } catch (error) {
    res.status(500).json({ message: error.message || 'An error occurred' })
  }
}

module.exports = {
  inviteModerator,
  acceptInvitation,
  rejectInvitation,
  leaveModeration,
  removeModerator,
  banUser,
  unbanUser,
  approveUser,
  getBannedUsers,
  unapproveUser,
  getApprovedUsers
}
