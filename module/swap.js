import mongoose, { Schema } from 'mongoose';

const SwapRequestSchema = new Schema({
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fromEvent: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    toEvent: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

const Swap = mongoose.models.Swap || mongoose.model("Swap", SwapRequestSchema);
export default Swap;