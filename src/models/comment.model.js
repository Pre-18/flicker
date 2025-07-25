import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content: { type: String, required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null }, // For nested comments
}, { timestamps: true });



commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);