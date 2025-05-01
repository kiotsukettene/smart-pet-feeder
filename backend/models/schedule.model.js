import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
    time: { type: String, required: true },
    portion: { type: String, required: true },
    frequency: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Paused'], default: 'Active' },
    days: { type: [String], default: [] },
    notes: { type: String, default: '' },
  }, { timestamps: true });

  const Schedule = mongoose.model("Schedule", scheduleSchema);
  export default Schedule;

  