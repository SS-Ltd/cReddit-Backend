// Import the actual CommunityModel
const { getTopCommunities, getEditedPosts } = require('../src/controllers/Community')
const CommunityModel = require('../src/models/Community')

// Mock the entire CommunityModel module
jest.mock('../src/models/Community')

// Mock the query object
const mockQuery = {
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(() => Promise.resolve(['community1', 'community2']))
}

// Mock the find method to return the mock query
CommunityModel.find.mockReturnValue(mockQuery)
CommunityModel.findOne = jest.fn()

describe('getTopCommunities', () => {
  // Returns a list of top communities sorted by members in descending order
  test('should return a list of top communities sorted by members in descending order', async () => {
    const req = { query: {} }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    await getTopCommunities(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(['community1', 'community2'])
  })

  // Returns an error if there is an issue with the database connection
  test('should return an error if there is an issue with the database connection', async () => {
    const req = { query: {} }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    CommunityModel.find.mockImplementationOnce(() => { throw new Error('Database connection error') })
    await getTopCommunities(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Database connection error' })
  })
})

describe('getEditedPosts', () => {
// Returns edited posts for a valid community name
  test('should return edited posts when a valid community name is provided', async () => {
    const req = { params: { communityName: 'validCommunity' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const community = { getEditedPosts: jest.fn().mockResolvedValue(['post1', 'post2']) }
    CommunityModel.findOne.mockResolvedValue(community)

    await getEditedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(['post1', 'post2'])
  })

  // Returns 404 when community is not found
  test('should return 404 when community is not found', async () => {
    const req = { params: { communityName: 'invalidCommunity' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    CommunityModel.findOne.mockResolvedValue(null)

    await getEditedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'invalidCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community not found' })
  })
})
