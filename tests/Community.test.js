// Import the actual CommunityModel
const { getTopCommunities } = require('../src/controllers/Community')
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
