import mongoose, { Schema } from 'mongoose';


const EventSchema = new Schema({
        title: { type: String, required: true },
        description: { type: String, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        status: {
            type: String,
            enum: ["BUSY", "SWAPPABLE"],
            default: "BUSY",
        },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});


const EventModel = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default EventModel;