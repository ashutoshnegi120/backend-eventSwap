import mongoose from "mongoose";

const ConnectDB = async () => {
    try {
        return await mongoose.connect(`${process.env.MONGODB_URI}`,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

    } catch (err) {
        console.error(`MongoDB connection failed with message : ${err.message}`);
        process.exit(1);
    }
};

export default ConnectDB;