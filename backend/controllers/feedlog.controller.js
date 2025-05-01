import FeedLog from "../models/feedlog.model.js";

export const getAllFeedLogs = async (req, res) => {
  try {
    const feedLogs = await FeedLog.find().sort({ createdAt: -1 }); // Sort by newest first
    res.json(feedLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createFeedLog = async (req, res) => {
  const feedLog = new FeedLog(req.body);
  try {
    const newFeedLog = await feedLog.save();
    res.status(201).json(newFeedLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};