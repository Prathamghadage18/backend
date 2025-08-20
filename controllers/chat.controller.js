import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Store online users
const onlineUsers = new Map();

export const chatController = {
    // Get all chat sessions for a user
    getUserChats: async (req, res) => {
        try {
            const userId = req.user.id;
            const chats = await Chat.find({
                participants: userId
            })
            .populate('participants', 'name email')
            .populate('messages.from', 'name')
            .sort({ updatedAt: -1 });

            const formattedChats = chats.map(chat => {
                const otherParticipant = chat.participants.find(p => p._id.toString() !== userId);
                return {
                    id: chat._id,
                    name: otherParticipant.name,
                    lastMsg: chat.lastMessage?.text || '',
                    online: onlineUsers.has(otherParticipant._id.toString())
                };
            });

            res.json(formattedChats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get chat history between two users
    getChatHistory: async (req, res) => {
        try {
            const { chatId } = req.params;
            const userId = req.user.id;

            const chat = await Chat.findOne({
                _id: chatId,
                participants: userId
            })
            .populate('messages.from', 'name');

            if (!chat) {
                return res.status(404).json({ message: 'Chat not found' });
            }

            const messages = chat.messages.map(msg => ({
                from: msg.from._id.toString() === userId ? 'me' : 'them',
                text: msg.text,
                timestamp: msg.createdAt
            }));

            res.json(messages);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Handle WebSocket events
    handleWebSocket: (io) => {
        io.on('connection', (socket) => {
            // User authentication using JWT token
            const userId = socket.handshake.auth.userId;
            if (userId) {
                onlineUsers.set(userId, socket.id);
                io.emit('userOnline', { userId });
            }

            // Handle new message
            socket.on('sendMessage', async (data) => {
                try {
                    const { chatId, text, toUserId } = data;
                    const fromUserId = userId;

                    let chat = chatId 
                        ? await Chat.findById(chatId)
                        : await Chat.findOne({
                            participants: { $all: [fromUserId, toUserId] }
                        });

                    if (!chat) {
                        chat = new Chat({
                            participants: [fromUserId, toUserId],
                            messages: [],
                        });
                    }

                    const newMessage = {
                        from: fromUserId,
                        to: toUserId,
                        text
                    };

                    chat.messages.push(newMessage);
                    chat.lastMessage = {
                        text,
                        timestamp: new Date()
                    };
                    await chat.save();

                    // Send to recipient if online
                    const recipientSocketId = onlineUsers.get(toUserId);
                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit('newMessage', {
                            chatId: chat._id,
                            message: {
                                from: 'them',
                                text
                            }
                        });
                    }

                    // Send confirmation to sender
                    socket.emit('messageSent', {
                        chatId: chat._id,
                        message: {
                            from: 'me',
                            text
                        }
                    });

                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                if (userId) {
                    onlineUsers.delete(userId);
                    io.emit('userOffline', { userId });
                }
            });
        });
    }
};

export default chatController;
