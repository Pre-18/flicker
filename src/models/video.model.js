import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const VideoSchema = new Schema({
  title: { type: String, required: true },
  duration: { type: Number, required: true },
  description: { type: String, required: true },
  videofile: { type: String, required: true },// cloudinary video url
  thumbnail: { type: String, required: true }, // cloudinary image url
  user: { type: String , unique: true, required: true, lowercase: true ,trim: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
},{timestamps: true});

VideoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", VideoSchema);
