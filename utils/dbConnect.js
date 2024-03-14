import mongoose from "mongoose";

export const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI, {
        dbName: 'Chat-App'
    }).then(c => console.log(`DB Connected to ${c.connection.host}`))
        .catch(e => console.log(e.message)
        );
}