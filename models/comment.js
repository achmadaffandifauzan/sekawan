const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
    text: String,
    type: {
        type: String,
        enum: ['options', 'essay']
    },
    choice: Number,
    choiceValue: String,
    correctness: Boolean,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Comment', commentSchema);