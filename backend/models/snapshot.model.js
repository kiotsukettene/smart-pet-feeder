import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    timestamp: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

const Snapshot = mongoose.model("Snapshot", snapshotSchema);
export default Snapshot;
