import e from "express";
import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
   
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User",
     
    },

  



},{ timestamps: true }); 

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

