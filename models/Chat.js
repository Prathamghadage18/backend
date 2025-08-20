import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const chatSessionSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messages: [messageSchema],
    lastMessage: {
        text: String,
        timestamp: Date
    }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSessionSchema);
export default Chat;
