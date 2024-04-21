const { request } = require('urllib')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const ATLAS_API_BASE_URL = 'https://cloud.mongodb.com/api/atlas/v1.0'
const ATLAS_PROJECT_ID = process.env.MONGODB_ATLAS_PROJECT_ID
const ATLAS_CLUSTER_NAME = process.env.MONGODB_ATLAS_CLUSTER_NAME
const ATLAS_CLUSTER_API_URL = `${ATLAS_API_BASE_URL}/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER_NAME}`
const ATLAS_SEARCH_INDEX_API_URL = `${ATLAS_CLUSTER_API_URL}/fts/indexes`

const ATLAS_API_PUBLIC_KEY = process.env.MONGODB_ATLAS_PUBLIC_KEY
const ATLAS_API_PRIVATE_KEY = process.env.MONGODB_ATLAS_PRIVATE_KEY
const DIGEST_AUTH = `${ATLAS_API_PUBLIC_KEY}:${ATLAS_API_PRIVATE_KEY}`

async function findIndexByName (indexName, collectionName) {
  const allIndexesResponse = await request(
    `${ATLAS_SEARCH_INDEX_API_URL}/cReddit/${collectionName}`,
    {
      dataType: 'json',
      contentType: 'application/json',
      method: 'GET',
      digestAuth: DIGEST_AUTH
    }
  )
  return allIndexesResponse.data.find((i) => i.name === indexName)
}

async function upsertSearchIndex (searchIndexName, collectionName) {
  const userSearchIndex = await findIndexByName(searchIndexName, collectionName)
  if (!userSearchIndex) {
    await request(ATLAS_SEARCH_INDEX_API_URL, {
      data: {
        name: searchIndexName,
        database: 'cReddit',
        collectionName: collectionName,
        mappings: {
          dynamic: true
        }
      },
      dataType: 'json',
      contentType: 'application/json',
      method: 'POST',
      digestAuth: DIGEST_AUTH
    })
  }
}

module.exports = {
  upsertSearchIndex
}
