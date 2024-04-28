const MessageModel = require('../models/Message')
const UserModel = require('../models/User')
const { sendMessage } = require('../utils/Message')

const createMessage = async (req, res) => {
  try {
    const to = req.to
    const from = req.from

    const receiver = await UserModel.findOne({ username: to })
    if (!receiver) {
      throw new Error('Receiver not found')
    }

    const subject = req.subject
    const text = req.text
    sendMessage(from, to, subject, text)
    res.status(200).send('Message sent')
  } catch (error) {
    res.status(400).send('Error sending message: ' + error.message)
  }
}

const getMessages = async (req, res) => {
  try {
    const username = req.decoded.username

    const messages = await MessageModel.find({ to: username, isDeleted: false })

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

    const messages = await MessageModel.find({ to: username, isRead: false, isDeleted: false })

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

    const messages = await MessageModel.find({ from: username, isDeleted: false })

    if (!messages || messages.length === 0) {
      return res.status(404).send('No messages found')
    }

    res.status(200).send(messages)
  } catch (error) {
    res.status(400).send('Error getting messages: ' + error.message)
  }
}

const deleteMessage = async (req, res) => {
  try {
    const username = req.decoded.username

    const messageId = req.params.messageId
    const message = await MessageModel.findOne({ _id: messageId, isDeleted: false, from: username })
    message.isDeleted = true

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
  deleteMessage,
  getUnreadMessages
}
