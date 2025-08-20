import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
