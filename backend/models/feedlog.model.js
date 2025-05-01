import mongoose from "mongoose";

const feedLogSchema = new mongoose.Schema({
  date: { type: String, required: true }, // e.g., "2025-04-03"
  time: { type: String, required: true }, // e.g., "06:00 AM"
  portion: { type: String, required: true }, // e.g., "100g"
  method: { type: String, enum: ["Manual", "Scheduled", "Manual-Button"], required: true },
  status: { type: String, enum: ["Successful", "Failed"], required: true },
  notes: { type: String },
}, { timestamps: true });

const FeedLog = mongoose.model("FeedLog", feedLogSchema);
export default FeedLog;