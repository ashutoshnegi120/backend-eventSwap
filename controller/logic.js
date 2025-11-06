import ConnectDB from '../database/connect.js'
import {hashPassword, verifyPassword} from '../utlity/hashAndVerifiy.js'
import User from '../module/user.js'
import Event from '../module/event.js'
import {jwtCreate} from '../auth/jwt.js'
import Swap from "../module/swap.js";
import mongoose from "mongoose";



// sign up

export async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "One or more fields are missing" });
        }

        await ConnectDB();
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hash = await hashPassword(password);
        if (!hash) {
            return res.status(500).json({ error: "Internal server error" });
        }

        const user = new User({ name, email, password: hash });
        await user.save();

        const token = jwtCreate(email);

        return res.status(201).json({
            message: "User registered successfully",
            token,
            userId: user._id,
            email: user.email
        });

    } catch (err) {
        console.error("Error in register:", err);
        return res.status(500).json({ error: "Server error" });
    }
}


// login

export async function logIn(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "One or more fields are missing" });
        }

        await ConnectDB();
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const validPassword = await verifyPassword(password, existingUser.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = jwtCreate(email);

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            userId: existingUser._id,
            email: existingUser.email
        });

    } catch (err) {
        console.error("Error in login:", err);
        return res.status(500).json({ error: "Server error" });
    }
}

//create event

export async function createEvent(req, res) {
    try{
        const {userId ,title , description, start , end , type} = req.body;
        if (!title || !description || !start || !end) {
            return res.status(400).json({ error: "one or more fields are missing" });
        }

        const startTime = new Date(start);
        const endTime = new Date(end);

        if (endTime <= startTime) {
            return res.status(400).json({ error: "End time must be after start time" });
        }
        const overlap = await Event.findOne(
                {
                    startTime: { $lt: end },
                    endTime: { $gt: start },
                },
        );

        if (overlap) {
            return res.status(409).json({ error: "Overlapping event exists in this time range" });
        }

        const event = new Event({
            title,
            description,
            startTime: start,
            endTime: end,
            status : type,
            userId,
        });

        await event.save();

        return res.status(201).json({ message: "Event created successfully", event });


    }catch (err){
        console.error("Error in createEvent:", err);
    }
}

//delete event

export async function deleteEvent(req, res) {
    try {
        const { eventId } = req.params;

        if (!eventId) {
            return res.status(400).json({ error: "eventId is missing" });
        }

        const deleteResult = await Event.deleteOne({ _id: eventId });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: "Event not found or already deleted" });
        }

        return res.status(200).json({ message: "Event deleted successfully" });
    } catch (err) {
        console.error("Error in deleteEvent:", err);
        return res.status(500).json({ error: "Server error while deleting event" });
    }
}

//update the event

export async function updateEvent(req, res) {
    try {
        const { eventId } = req.params;
        if (!eventId) {
            return res.status(400).json({ error: "eventId is missing" });
        }

        // Supports both body and query
        const { title, description, startTime, endTime, type, status } = {
            ...req.query,
            ...req.body,
        };

        const existingEvent = await Event.findById(eventId);
        if (!existingEvent) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Validate dates if both provided
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (isNaN(start) || isNaN(end)) {
                return res.status(400).json({ error: "Invalid date format" });
            }
            if (end <= start) {
                return res.status(400).json({ error: "End time must be after start time" });
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            {
                $set: {
                    title: title ?? existingEvent.title,
                    description: description ?? existingEvent.description,
                    startTime: startTime ?? existingEvent.startTime,
                    endTime: endTime ?? existingEvent.endTime,
                    status: (status ?? type) ?? existingEvent.status, // ✅ Accept both
                },
            },
            { new: true }
        );

        return res.status(200).json({ message: "Event updated successfully", event: updatedEvent });

    } catch (err) {
        console.error("Error in updateEvent:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

//user event get

export async function getEventByUserId(req, res) {
    try {
        const { userId } = req.params;
        console.log(userId);
        if (!userId) {
            return res.status(400).json({ error: "userId is missing" });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        const events = await Event.find({ userId: new mongoose.Types.ObjectId(userId) });

        if (!events || events.length === 0) {
            return res.status(404).json({ error: "No events found for this user" });
        }

        return res.status(200).json({
            message: "Events retrieved successfully",
            data: events,
        });
    } catch (err) {
        console.error("Error in getEventByUserId:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// get all the swap able event

export async function getSwappableEvent(req, res) {
    try {
        const id = decodeURIComponent(req.params.id);
        const events = await Event.find({ status: "SWAPPABLE", userId: { $ne: id } });

        if (!events || events.length === 0) {
            return res.status(404).json({ error: "No swappable events found" });
        }

        return res.status(200).json({
            message: "Swappable events retrieved successfully",
            data: events,
        });
    } catch (err) {
        console.error("Error in getSwappableEvent:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// swap event life cycle
/*
*  get the event from marketplace
*  raise the request
*   is user is online get the request using SSE . if user offline get inform using email
*   if user press the ok then exchange happened
*
*
*
* */

const clients = new Map();

export async function subscribeUser(req, res) {
    const email = decodeURIComponent(req.params.email);

    // CORS for SSE (adjust origin if needed)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const heartbeat = setInterval(() => {
        res.write(`event: ping\n`);
        res.write(`data: ${Date.now()}\n\n`);
    }, 25000);

    clients.set(email, res);
    console.log(`📡 SSE connected: ${email}`);

    req.on("close", () => {
        clearInterval(heartbeat);
        clients.delete(email);
        console.log(`SSE closed: ${email}`);
    });
}



export async function sendSwapRequest(req, res) {
    try {
        const { id, eventId, userEventId } = req.params;

        if (!eventId || !userEventId) {
            return res.status(400).json({ error: "eventId or userEventId is missing" });
        }

        const event = await Event.findById(eventId).select("userId");
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const user = await User.findById(event.userId).select("email");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const newSwap = new Swap({
            fromUser: id,
            toUser: event.userId,
            fromEvent: eventId,
            toEvent: userEventId,
        });
        await newSwap.save();

        const client = clients.get(user.email.toString());
        if (client) {
            client.write(`event: swapRequest\n`);
            client.write(`data: ${JSON.stringify(newSwap)}\n\n`);
            console.log(`Swap request sent to ${user.email}`);
        } else {
            console.log(`📭 User ${user.email} not connected. Send email instead.`);
            // TODO: integrate email notification (e.g., Nodemailer)
        }
        return res.status(201).json({
            message: "Swap request created successfully",
        });

    } catch (err) {
        console.error("Error in sendSwapRequest:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}




export async function responseToRequest(req, res) {
    try {
        const { swapId } = req.params;
        const { isAccepted } = req.body;

        if (typeof isAccepted === "undefined") {
            return res.status(400).json({ error: "isAccepted flag is missing" });
        }

        const swap = await Swap.findById(swapId);
        if (!swap) return res.status(404).json({ error: "Swap not found" });

        // Get both users' emails for SSE
        const [fromUserDoc, toUserDoc] = await Promise.all([
            User.findById(swap.fromUser).select("email"),
            User.findById(swap.toUser).select("email"),
        ]);

        const fromClient = fromUserDoc ? clients.get(fromUserDoc.email) : undefined;
        const toClient   = toUserDoc ? clients.get(toUserDoc.email) : undefined;

        if (!isAccepted) {
            await Swap.findByIdAndUpdate(swapId, { status: "REJECTED" });
            const payload = JSON.stringify({ ...swap.toObject(), status: "REJECTED" });
            if (fromClient) {
                fromClient.write(`event: swapResponse\n`);
                fromClient.write(`data: ${payload}\n\n`);
            }
            if (toClient) {
                toClient.write(`event: swapResponse\n`);
                toClient.write(`data: ${payload}\n\n`);
            }
            return res.status(200).json({ message: "Swap request rejected" });
        }

        // ACCEPT path – perform atomic swap
        const fromEvent = await Event.findById(swap.fromEvent);
        const toEvent = await Event.findById(swap.toEvent);
        if (!fromEvent || !toEvent) return res.status(404).json({ error: "Event not found" });

        const tempStart = fromEvent.startTime;
        const tempEnd = fromEvent.endTime;

        const session = await Event.startSession();
        session.startTransaction();

        try {
            const updateFromEvent = await Event.findByIdAndUpdate(
                swap.fromEvent,
                { $set: { startTime: toEvent.startTime, endTime: toEvent.endTime, status: "BUSY" } },
                { new: true, session }
            );

            const updateToEvent = await Event.findByIdAndUpdate(
                swap.toEvent,
                { $set: { startTime: tempStart, endTime: tempEnd, status: "BUSY" } },
                { new: true, session }
            );

            await Swap.findByIdAndUpdate(swapId, { status: "ACCEPTED" }, { session });
            await session.commitTransaction();
            session.endSession();

            const payload = JSON.stringify({ ...swap.toObject(), status: "ACCEPTED" });
            if (fromClient) {
                fromClient.write(`event: swapResponse\n`);
                fromClient.write(`data: ${payload}\n\n`);
            }
            if (toClient) {
                toClient.write(`event: swapResponse\n`);
                toClient.write(`data: ${payload}\n\n`);
            }

            return res.status(200).json({
                message: "Swap completed successfully",
                updatedEvents: { updateFromEvent, updateToEvent },
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Transaction failed:", error);
            return res.status(500).json({ error: "Swap transaction failed" });
        }
    } catch (err) {
        console.error("Error in responseToRequest:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getSwapData(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(404).json({ error: "id not found" });
        }

        // Fetch all swaps where user is either fromUser or toUser
        const result = await Swap.find({
            $or: [
                { fromUser: id },
                { toUser: id }
            ]
        }).populate("fromUser", "name email").populate("toUser","name email").populate("fromEvent")
            .populate("toEvent");

        return res.status(200).json(result);
    } catch (err) {
        console.error("Error in getSwapData:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getBlockedTimes(req, res) {
    try {
        const events = await Event.find(
            {},
            { startTime: 1, endTime: 1, _id: 0 }
        );

        const blocked = events
            .filter(e => e.startTime && e.endTime)
            .map(e => ({
                start: e.startTime,
                end: e.endTime
            }));

        return res.status(200).json(blocked);

    } catch (err) {
        console.error("Error getBlockedTimes:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}


