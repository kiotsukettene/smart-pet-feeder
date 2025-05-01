import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './database/connectDB.js';
import scheduleRoutes from './routes/schedule.routes.js';
import feedLogRoutes from './routes/feedlog.routes.js';
import Schedule from './models/schedule.model.js';
import FeedLog from './models/feedlog.model.js';
import snapshotRoutes from "./routes/snapshot.route.js";
import path from "path";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const ESP32_IP = '192.168.29.118'

app.use(cors());
app.use(express.json());

//upload path
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.get("/", (req, res) => {
  res.send("PetFeeds Backend is running");
});

// Routes
app.use("/api/schedule", scheduleRoutes);
app.use("/api/snapshot", snapshotRoutes);
app.use('/api/feed-log', feedLogRoutes);

// Periodic task to check schedules and trigger feeds
const checkSchedules = async () => {
  try {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
    const currentDate = now.toISOString().split('T')[0];

    const schedules = await Schedule.find({ status: 'Active' });
    for (const schedule of schedules) {
      const isDaily = schedule.frequency === 'daily';
      const isSpecificDay = schedule.frequency === 'specific' && schedule.days.includes(currentDay);
      const timeMatches = schedule.time === currentTime;

      if (timeMatches && (isDaily || isSpecificDay)) {
        console.log(`Triggering feed for schedule: ${schedule.time}, ${schedule.portion}`);
        try {
          // Extract numeric portion value and ensure it's within valid range
          const portionValue = parseFloat(schedule.portion.replace('g', ''));
          if (isNaN(portionValue) || portionValue < 10 || portionValue > 200) {
            throw new Error(`Invalid portion size: ${schedule.portion}`);
          }

          // Send feed command to ESP32
          const esp32Response = await fetch(`http://${ESP32_IP}/feed?portion=${portionValue}`, {
            method: 'GET',
            headers: {
              'Accept': 'text/plain',
              'Content-Type': 'application/json'
            }
          });

          if (!esp32Response.ok) {
            const errorText = await esp32Response.text();
            throw new Error(`ESP32 responded with error: ${esp32Response.status} - ${errorText}`);
          }

          const responseText = await esp32Response.text();
          console.log(`ESP32 feed response: ${responseText}`);

          // Log the successful feed event
          await FeedLog.create({
            date: currentDate,
            time: schedule.time,
            portion: schedule.portion,
            method: 'Scheduled',
            status: 'Successful',
            notes: `Automated feed: ${responseText}`
          });

        } catch (error) {
          console.error(`Feed failed for schedule ${schedule._id}:`, error.message);
          // Log the failed feed event
          await FeedLog.create({
            date: currentDate,
            time: schedule.time,
            portion: schedule.portion,
            status: 'Failed',
            method: 'Scheduled',
            notes: `Error: ${error.message}`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking schedules:', error);
  }
};

// Run checkSchedules every minute
setInterval(checkSchedules, 60 * 1000);

app.listen(PORT, () => {
  connectDB();
  console.log("Server is running on port", PORT);
});