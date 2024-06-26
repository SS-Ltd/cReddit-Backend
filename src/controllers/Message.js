const MessageModel = require('../models/Message')
const UserModel = require('../models/User')
const { sendMessage } = require('../utils/Message')

const createMessage = async (req, res) => {
  try {
    const to = req.body.to
    const from = req.decoded.username

    const receiver = await UserModel.findOne({ username: to })
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' })
    }

    const subject = req.body.subject
    const text = req.body.text
    const ID = await sendMessage(from, to, subject, text)
    res.status(200).json({
      message: 'Message sent',
      messageID: ID
    })
  } catch (error) {
    res.status(400).json({ message: 'Error sending message: ' + error.message })
  }
}

const getMessages = async (req, res) => {
  try {
    const username = req.decoded.username
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 25

    let messages = await MessageModel.find({ $or: [{ from: username }, { to: username }], isDeleted: false, isRead: false, subject: { $not: /^invitation|^post|^Mentioned/ } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    messages = messages.map(message => { return message.toObject() })
    messages.forEach(message => {
      if (message.from === username) {
        message.isRead = true
      }
    })

    if (!messages || messages.length === 0) {
      return res.status(404).send('No messages found')
    }

    res.status(200).send(messages)
  } catch (error) {
    res.status(400).send('Error getting messages: ' + error.message)
  }
}

const getInbox = async (req, res) => {
  try {
    const username = req.decoded.username
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 25

    const messages = await MessageModel.find({ to: username, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    if (!messages || messages.length === 0) {
      return res.status(404).send('No messages found')
    }

    res.status(200).send(messages)
  } catch (error) {
    res.status(400).send('Error getting messages: ' + error.message)
  }
}

const getUnreadMessages = async (req, res) => {
  try {
    const username = req.decoded.username
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 25

    const messages = await MessageModel.find({ to: username, isRead: false, isDeleted: false, subject: { $not: /^invitation|^post|^Mentioned/ } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    if (!messages || messages.length === 0) {
      return res.status(404).send('No messages found')
    }

    res.status(200).send(messages)
  } catch (error) {
    res.status(400).send('Error getting messages: ' + error.message)
  }
}

const markAsRead = async (req, res) => {
  try {
    const messageId = req.params.messageId
    const username = req.decoded.username
    const message = await MessageModel.findOne({ _id: messageId, to: username })

    if (!message) {
      return res.status(404).send('Message not found')
    }

    message.isRead = true
    await message.save()
    res.status(200).send('Message marked as read')
  } catch (error) {
    res.status(400).send('Error marking message as read: ' + error.message)
  }
}

const markAllAsRead = async (req, res) => {
  try {
    const username = req.decoded.username

    const messages = await MessageModel.find({ to: username, isRead: false, isDeleted: false })

    messages.forEach(async message => {
      message.isRead = true
      await message.save()
    })
    res.status(200).send('All messages marked as read')
  } catch (error) {
    res.status(400).send('Error marking messages as read: ' + error)
  }
}

const getSentMessages = async (req, res) => {
  try {
    const username = req.decoded.username
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 25

    const messages = await MessageModel.find({ from: username, isDeleted: false, subject: { $not: /^invitation|^post|^Mentioned/ } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    if (!messages || messages.length === 0) {
      return res.status(404).send('No messages found')
    }

    res.status(200).send(messages)
  } catch (error) {
    res.status(400).send('Error getting messages: ' + error.message)
  }
}

const getPostReplies = async (req, res) => {
  try {
    const username = req.decoded.username
    const user = await UserModel.findOne({ username, isDeleted: false })
    if (!user) {
      return res.status(404).send('User not found')
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const page = req.query.page ? parseInt(req.query.page) - 1 : 0

    const messages = await MessageModel.find({ to: username, isDeleted: false, subject: { $regex: /^post reply:/ } }).sort({ createdAt: -1 }).skip(page * limit).limit(limit).exec()

    res.status(200).json(messages)
  } catch (error) {
    res.status(500).send('Error getting post replies: ' + error.message)
  }
}

const getUsernameMentions = async (req, res) => {
  try {
    const username = req.decoded.username
    const user = await UserModel.findOne({ username, isDeleted: false })
    if (!user) {
      return res.status(404).send('User not found')
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const page = req.query.page ? parseInt(req.query.page) - 1 : 0

    const messages = await MessageModel.find({ to: username, isDeleted: false, subject: { $regex: /^Mentioned/ } }).sort({ createdAt: -1 }).skip(page * limit).limit(limit).exec()

    res.status(200).json(messages)
  } catch (error) {
    res.status(500).send('Error getting post replies: ' + error.message)
  }
}

const deleteMessage = async (req, res) => {
  try {
    const username = req.decoded.username

    const messageId = req.params.messageId
    const message = await MessageModel.findOne({ _id: messageId, isDeleted: false, from: username })

    if (!message) {
      return res.status(200).send('Message deleted successfully')
    }

    message.isDeleted = true

    await message.save()
    res.status(200).send('Message deleted successfully')
  } catch (error) {
    res.status(400).send('Error deleting message: ' + error.message)
  }
}

module.exports = {
  createMessage,
  getMessages,
  markAsRead,
  markAllAsRead,
  getSentMessages,
  getPostReplies,
  getUsernameMentions,
  deleteMessage,
  getUnreadMessages,
  getInbox
}
