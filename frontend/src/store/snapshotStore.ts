import { create } from "zustand";
import toast from "react-hot-toast";
import { API_URL } from "@/config";

interface Snapshot {
  _id?: string;
  url: string;
  timestamp: string;
  reason: string;
}

interface SnapshotState {
  snapshots: Snapshot[];
  fetchSnapshots: () => Promise<void>;
  addSnapshot: (
    imageFile: File,
    timestamp: string,
    reason: string
  ) => Promise<void>;
  updateSnapshot: (id: string, snapshot: Snapshot) => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;
}

export const useSnapshotStore = create<SnapshotState>((set) => ({
  snapshots: [],
  fetchSnapshots: async () => {
    const response = await fetch(`${API_URL}/api/snapshot`);
    const data = await response.json();
    set({ snapshots: data });
  },
  addSnapshot: async (imageFile, timestamp, reason) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("timestamp", timestamp);
    formData.append("reason", reason);

    const response = await fetch(`${API_URL}/api/snapshot`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const newSnapshot = await response.json();
    set((state) => ({ snapshots: [...state.snapshots, newSnapshot] }));
    toast.success("Snapshot added successfully!");
  },
  updateSnapshot: async (id, snapshot) => {
    const response = await fetch(`${API_URL}/api/snapshot/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    const updatedSnapshot = await response.json();
    set((state) => ({
      snapshots: state.snapshots.map((s) =>
        s._id === id ? updatedSnapshot : s
      ),
    }));
    toast.success("Snapshot updated successfully!");
  },
  deleteSnapshot: async (id) => {
    await fetch(`${API_URL}/api/snapshot/${id}`, {
      method: "DELETE",
    });
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s._id !== id),
    }));
    toast.success("Snapshot deleted successfully!");
  },
}));
