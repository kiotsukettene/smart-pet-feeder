import { create } from "zustand";
import toast from "react-hot-toast";
import { API_URL} from "@/config";


interface Schedule {
  _id?: string;
  time: string;
  portion: string;
  frequency: "daily" | "custom" | "specific";
  status: "Active" | "Paused";
  days?: string[];
  notes?: string;
}

interface ScheduleState {
  schedules: Schedule[];
  fetchSchedules: () => Promise<void>;
  addSchedule: (schedule: Schedule) => Promise<void>;
  updateSchedule: (id: string, schedule: Schedule) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}


export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  fetchSchedules: async () => {
    const response = await fetch(`${API_URL}/api/schedule`);
    const data = await response.json();
    set({ schedules: data });
  },
  addSchedule: async (schedule) => {
    const response = await fetch(`${API_URL}/api/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    const newSchedule = await response.json();
    set((state) => ({ schedules: [...state.schedules, newSchedule] }));
    toast.success("Schedule added successfully!"); // Added here too
  },
  updateSchedule: async (id, schedule) => {
    const response = await fetch(`${API_URL}/api/schedule/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    const updatedSchedule = await response.json();
    set((state) => ({
      schedules: state.schedules.map((s) => (s._id === id ? updatedSchedule : s)),
    }));
    toast.success("Schedule updated successfully!"); // Added here too
  },
  deleteSchedule: async (id) => {
    await fetch(`${API_URL}/api/schedule/${id}`, { method: "DELETE" });
    set((state) => ({
      schedules: state.schedules.filter((s) => s._id !== id),
    }));
    toast.success("Schedule deleted successfully!"); // Added here too
  },
}));