import Snapshot from "../models/snapshot.model.js";

export const getAllSnapshots = async (req, res) => {
  try {
    const snapshots = await Snapshot.find();
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSnapshot = async (req, res) => {
  try {
    const { timestamp, reason } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Construct the URL or file path to store in the database
    const imageUrl = `/uploads/${req.file.filename}`; // Relative path to the uploaded file

    const snapshot = new Snapshot({
      url: imageUrl,
      timestamp,
      reason,
    });

    const newSnapshot = await snapshot.save();
    res.status(201).json(newSnapshot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSnapshot = async (req, res) => {
  try {
    const snapshot = await Snapshot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!snapshot)
      return res.status(404).json({ message: "Snapshot not found" });
    res.json(snapshot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSnapshot = async (req, res) => {
  try {
    const snapshot = await Snapshot.findByIdAndDelete(req.params.id);
    if (!snapshot)
      return res.status(404).json({ message: "Snapshot not found" });
    res.json({ message: "Snapshot deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
