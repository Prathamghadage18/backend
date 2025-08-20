import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant",
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["request", "reminder", "payment", "system", " t"],
    required: true,
  },
  read: { type: Boolean, default: false },
  link: String,
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
