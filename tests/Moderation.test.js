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

describe('inviteModerator', () => {
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
    expect(community.save).toHaveBeenCalled()
    expect(community.invitations).toHaveLength(0)
    expect(community.moderators).toContain('loggedInUser')
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
