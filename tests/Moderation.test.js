const UserModel = require('../src/models/User')
const CommunityModel = require('../src/models/Community')
const Moderation = require('../src/controllers/Moderation')
const MessageUtils = require('../src/utils/Message')

jest.mock('../src/utils/Message', () => {
  return {
    sendMessage: jest.fn()
  }
})

describe('inviteModerator', () => {
  test('should successfully invite a user to moderate a community', async () => {
    const req = {
      body: {
        username: 'testuser'
      },
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser'],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false
    }

    const user = {
      username: 'testuser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
      .mockResolvedValueOnce(user)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.inviteModerator(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator invitation sent' })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should not send an invitation if the user is already a moderator', async () => {
    const req = {
      body: {
        username: 'testuser'
      },
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser', 'testuser'],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false
    }

    const user = {
      username: 'testuser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
      .mockResolvedValueOnce(user)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.inviteModerator(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(MessageUtils.sendMessage).toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User is already a moderator' })
  })

  test('should not send an invitation if the loggedInUser is not a moderator', async () => {
    const req = {
      body: {
        username: 'testuser'
      },
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: [],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false
    }

    const user = {
      username: 'testuser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
      .mockResolvedValueOnce(user)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.inviteModerator(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(MessageUtils.sendMessage).toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator' })
  })

  test('should not send an invitation if the user has already been invited', async () => {
    const req = {
      body: {
        username: 'testuser'
      },
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser'],
      invitations: ['testuser'],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
      .mockResolvedValueOnce({ username: 'testuser', isDeleted: false })
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.inviteModerator(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(MessageUtils.sendMessage).toHaveBeenCalled()
    expect(community.invitations).toHaveLength(1)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User has already been invited' })
  })

  test('should return a 404 error if the user is not found', async () => {
    const req = {
      body: {
        username: 'testuser'
      },
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser'],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
      .mockResolvedValueOnce(null)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.inviteModerator(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })
})

describe('acceptInvitation', () => {
  test('should successfully accept a user invite to moderate a community', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: [],
      invitations: ['loggedInUser'],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      moderatorInCommunities: [],
      preferences: {
        invitationNotifs: true
      },
      save: jest.fn()
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.acceptInvitation(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toContain('loggedInUser')
    expect(loggedInUser.moderatorInCommunities).toContain('testcommunity')
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator invitation accepted' })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should not accept a user invite to moderate a community if user has not been invited', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: [],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.acceptInvitation(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(0)
    expect(res.json).toHaveBeenCalledWith({ message: 'You have not been invited to moderate this community' })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('should not accept a user invite to moderate a community if user is a moderator', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser'],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.acceptInvitation(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(1)
    expect(res.json).toHaveBeenCalledWith({ message: 'You have not been invited to moderate this community' })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('should return an error message when the community is deleted', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'testUser', isDeleted: false })
    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await Moderation.acceptInvitation(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community not found' })
  })
})

describe('rejectInvitation', () => {
  test('should successfully reject a user invite to moderate a community', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: [],
      invitations: ['loggedInUser'],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.rejectInvitation(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(0)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator invitation rejected' })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should not reject a user invite to moderate a community if user has not been invited', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: [],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.rejectInvitation(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(0)
    expect(res.json).toHaveBeenCalledWith({ message: 'You have not been invited to moderate this community' })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('should not reject a user invite to moderate a community if user is a moderator', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser'],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.rejectInvitation(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(1)
    expect(res.json).toHaveBeenCalledWith({ message: 'You have not been invited to moderate this community' })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('should return an error message when the community is deleted', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'testUser', isDeleted: false })
    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await Moderation.rejectInvitation(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community not found' })
  })
})

describe('leaveModeration', () => {
  test('should successfully leave community moderation', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser'],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      moderatorInCommunities: ['testcommunity'],
      preferences: {
        invitationNotifs: true
      },
      save: jest.fn()
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.leaveModeration(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(0)
    expect(loggedInUser.moderatorInCommunities).toHaveLength(0)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator left' })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return an error message if user is not a moderator', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: [],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.leaveModeration(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(0)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator of this community' })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('should return an error message when the community is deleted', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'testUser', isDeleted: false })
    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await Moderation.leaveModeration(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community not found' })
  })
})

describe('removeModerator', () => {
  test('should successfully remove community moderation', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      body: {
        username: 'testuser'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser', 'testuser'],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    const user = {
      username: 'testuser',
      isDeleted: false,
      moderatorInCommunities: ['testcommunity'],
      preferences: {
        invitationNotifs: true
      },
      save: jest.fn()
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
      .mockResolvedValueOnce(user)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.removeModerator(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(1)
    expect(user.moderatorInCommunities).toHaveLength(0)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator removed' })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return an error message if user is not a moderator', async () => {
    const req = {
      params: {
        communityName: 'testcommunity'
      },
      body: {
        username: 'testuser'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: ['loggedInUser'],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    const user = {
      username: 'testuser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
      .mockResolvedValueOnce(user)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.removeModerator(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'loggedInUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testcommunity', isDeleted: false })
    expect(community.save).not.toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toHaveLength(1)
    expect(res.json).toHaveBeenCalledWith({ message: 'User is already not a moderator' })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('should return an error message when the community is deleted', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      body: {
        username: 'testUser'
      },
      decoded: {
        username: 'loggedInUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testcommunity',
      isDeleted: false,
      moderators: [],
      invitations: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'loggedInUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      preferences: {
        invitationNotifs: true
      }
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(loggedInUser)
      .mockResolvedValueOnce(user)
    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(community)

    await Moderation.removeModerator(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator' })
  })
})

describe('banUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should ban user when user is not already banned in the community', async () => {
    const req = {
      body: {
        username: 'testUser',
        rule: 'testRule'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      bannedUsers: [],
      rules: [{
        text: 'testRule'
      }],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    const userToBan = {
      username: 'testUser',
      bannedInCommunities: [],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToBan)

    await Moderation.banUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(community.bannedUsers).toHaveLength(1)
    expect(userToBan.bannedInCommunities).toContain('testCommunity')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User banned' })
  })

  test('should return an error message when attempting to ban a user in a non-existent community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'nonExistentCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    UserModel.findOne = jest.fn().mockResolvedValue(null)
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await Moderation.banUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentCommunity', isDeleted: false })
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community does not exist' })
  })

  test('should return an error message when the logged in user does not exist', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      bannedUsers: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await Moderation.banUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator does not exist' })
  })

  test('should return an error message when the logged in user is not a moderator in this community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      bannedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.banUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator of this community' })
  })

  test('should return an error message when attempting to ban a user who does not exist', async () => {
    const req = {
      body: {
        username: 'nonExistentUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      bannedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(null)

    await Moderation.banUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonExistentUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User does not exist' })
  })

  test('should return an error message when attempting to ban a user with an invalid rule', async () => {
    const req = {
      body: {
        username: 'testUser',
        rule: 'invalidRule'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      bannedUsers: [],
      rules: [{
        text: 'testRule'
      }]
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    const userToBan = {
      username: 'testUser',
      bannedInCommunities: [],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToBan)

    await Moderation.banUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Rule does not exist' })
  })
})

describe('unbanUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should unban user when user is already banned in the community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      bannedUsers: [{
        name: 'testUser',
        reasonToBan: 'testReason'
      }],
      rules: [{
        text: 'testRule'
      }],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    const userToBan = {
      username: 'testUser',
      bannedInCommunities: ['testCommunity'],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToBan)

    await Moderation.unbanUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(community.bannedUsers).toHaveLength(0)
    expect(userToBan.bannedInCommunities).not.toContain('testCommunity')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User unbanned' })
  })

  test('should not unban user when user is already not banned in the community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      bannedUsers: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    const userToBan = {
      username: 'testUser',
      bannedInCommunities: [],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToBan)

    await Moderation.unbanUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(community.bannedUsers).toHaveLength(0)
    expect(userToBan.bannedInCommunities).toHaveLength(0)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User is not banned' })
  })

  test('should return an error message when attempting to unban a user in a non-existent community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'nonExistentCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    UserModel.findOne = jest.fn().mockResolvedValue(null)
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await Moderation.unbanUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentCommunity', isDeleted: false })
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community does not exist' })
  })

  test('should return an error message when the logged in user does not exist', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      bannedUsers: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await Moderation.unbanUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator does not exist' })
  })

  test('should return an error message when the logged in user is not a moderator in this community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      bannedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.unbanUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator of this community' })
  })

  test('should return an error message when attempting to ban a user who does not exist', async () => {
    const req = {
      body: {
        username: 'nonExistentUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      bannedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(null)

    await Moderation.unbanUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonExistentUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User does not exist' })
  })
})

describe('getBannedUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should retrieve banned users when community and moderator are valid', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'validModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false,
      moderators: ['validModerator'],
      bannedUsers: [{
        name: 'user1',
        reasonToBan: 'testReason1'
      }, {
        name: 'user2',
        reasonToBan: 'testReason2'
      }],
      rules: [{
        text: 'testRule1'
      }, {
        text: 'testRule2'
      }]
    }

    const loggedInUser = {
      username: 'validModerator',
      isDeleted: false,
      moderatorInCommunities: ['validCommunity']
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.getBannedUsers(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'validModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      bannedUsers: [{
        name: 'user1',
        reasonToBan: 'testReason1'
      }, {
        name: 'user2',
        reasonToBan: 'testReason2'
      }]
    })
  })

  test('should return error when community name is invalid', async () => {
    const req = {
      params: {
        communityName: 'invalidCommunity'
      },
      decoded: {
        username: 'validModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    UserModel.findOne = jest.fn().mockResolvedValue(null)
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await Moderation.getBannedUsers(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'invalidCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community does not exist' })
  })

  test('should return error for non-existent moderator', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'nonExistentModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      bannedUsers: []
    }

    const loggedInUser = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.getBannedUsers(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonExistentModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator does not exist' })
  })

  test('should return error when moderator does not belong to community', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      bannedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      isDeleted: false,
      moderatorInCommunities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.getApprovedUsers(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator of this community' })
  })
})

describe('approveUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should approve user when user is not already approved in the community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      type: 'public',
      moderators: ['testModerator'],
      approvedUsers: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    const userToApprove = {
      username: 'testUser',
      approvedInCommunities: [],
      save: jest.fn(),
      communities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToApprove)

    await Moderation.approveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(community.approvedUsers).toContain('testUser')
    expect(userToApprove.approvedInCommunities).toContain('testCommunity')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User approved' })
  })

  test('should approve user when user is approved in other community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity2'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity2',
      type: 'public',
      isDeleted: false,
      moderators: ['testModerator'],
      approvedUsers: [],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity2']
    }

    const userToApprove = {
      username: 'testUser',
      approvedInCommunities: ['testCommunity'],
      save: jest.fn(),
      communities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToApprove)

    await Moderation.approveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity2', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(community.approvedUsers).toContain('testUser')
    expect(userToApprove.approvedInCommunities).toContain('testCommunity2')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User approved' })
  })

  test('should return an error message when attempting to approve a user in a non-existent community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'nonExistentCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await Moderation.approveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentCommunity', isDeleted: false })
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community does not exist' })
  })

  it('should return an error message when the logged in user does not exist', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      approvedUsers: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await Moderation.approveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator does not exist' })
  })

  test('should return an error message when the logged in user is not a moderator in this community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      approvedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.approveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator of this community' })
  })

  test('should return error message when attempting to approve a user who does not exist', async () => {
    const req = {
      body: {
        username: 'nonExistentUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      approvedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(null)

    await Moderation.approveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonExistentUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User does not exist' })
  })

  test('should return error message when attempting to approve a user who is already approved', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      approvedUsers: ['testUser']
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    const userToApprove = {
      username: 'testUser',
      approvedInCommunities: ['testCommunity']
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToApprove)

    await Moderation.approveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User is already approved' })
  })
})

describe('unapproveUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should unapprove user when user is already approved in the community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      approvedUsers: ['testUser'],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    const userToApprove = {
      username: 'testUser',
      approvedInCommunities: ['testCommunity'],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToApprove)

    await Moderation.unapproveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(community.approvedUsers).not.toContain('testUser')
    expect(userToApprove.approvedInCommunities).not.toContain('testCommunity')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User unapproved' })
  })

  test('should unapprove user when user is approved in other community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity2'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity2',
      isDeleted: false,
      moderators: ['testModerator'],
      approvedUsers: ['testUser'],
      save: jest.fn()
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity2']
    }

    const userToApprove = {
      username: 'testUser',
      approvedInCommunities: ['testCommunity', 'testCommunity2'],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToApprove)

    await Moderation.unapproveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity2', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(community.approvedUsers).not.toContain('testUser')
    expect(userToApprove.approvedInCommunities).not.toContain('testCommunity2')
    expect(userToApprove.approvedInCommunities).toContain('testCommunity')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User unapproved' })
  })

  test('should return an error message when attempting to unapprove a user in a non-existent community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'nonExistentCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await Moderation.unapproveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentCommunity', isDeleted: false })
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community does not exist' })
  })

  it('should return an error message when the logged in user does not exist', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      approvedUsers: ['testUser']
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await Moderation.unapproveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator does not exist' })
  })

  test('should return an error message when the logged in user is not a moderator in this community', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      approvedUsers: ['testUser']
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.unapproveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator of this community' })
  })

  test('should return error message when attempting to unapprove a user who does not exist', async () => {
    const req = {
      body: {
        username: 'nonExistentUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      approvedUsers: ['testUser']
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(null)

    await Moderation.unapproveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonExistentUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User does not exist' })
  })

  test('should return error message when attempting to unapprove a user who is already unapproved', async () => {
    const req = {
      body: {
        username: 'testUser'
      },
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      approvedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      moderatorInCommunities: ['testCommunity']
    }

    const userToApprove = {
      username: 'testUser',
      approvedInCommunities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValueOnce(loggedInUser).mockReturnValueOnce(userToApprove)

    await Moderation.unapproveUser(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User is not approved' })
  })
})

describe('getApprovedUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should retrieve approved users when community and moderator are valid', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'validModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false,
      moderators: ['validModerator'],
      approvedUsers: ['user1', 'user2']
    }

    const loggedInUser = {
      username: 'validModerator',
      isDeleted: false,
      moderatorInCommunities: ['validCommunity']
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.getApprovedUsers(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'validModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(['user1', 'user2'])
  })

  test('should return error when community name is invalid', async () => {
    const req = {
      params: {
        communityName: 'invalidCommunity'
      },
      decoded: {
        username: 'validModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await Moderation.getApprovedUsers(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'invalidCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community does not exist' })
  })

  test('should return error for non-existent moderator', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'nonExistentModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['testModerator'],
      approvedUsers: []
    }

    const loggedInUser = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.getApprovedUsers(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonExistentModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator does not exist' })
  })

  test('should return error when moderator does not belong to community', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      decoded: {
        username: 'testModerator'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      moderators: ['otherModerator'],
      approvedUsers: []
    }

    const loggedInUser = {
      username: 'testModerator',
      isDeleted: false,
      moderatorInCommunities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(loggedInUser)

    await Moderation.getApprovedUsers(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testModerator', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not a moderator of this community' })
  })
})
