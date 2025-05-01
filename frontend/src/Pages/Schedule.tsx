"use client";

import { useState, useEffect } from "react";
import { Info, Plus, Trash2, Settings, CalendarX } from "lucide-react";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";  
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScheduleStore } from "@/store/scheduleStore";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { API_URL } from "@/config";
import { useNavigate } from "react-router-dom";

const daysOfWeek = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

interface Schedule {
  _id?: string;
  time: string;
  portion: string;
  frequency: "daily" | "custom" | "specific";
  status: "Active" | "Paused";
  days?: string[];
  notes?: string;
}

interface Feed {
  _id: string;
  date: string;
  time: string;
  portion: string;
  status: "Successful" | "Failed";
  method: "Manual" | "Scheduled" | "Manual-Button";
}

const scheduleSchema = z.object({
  time: z.string().nonempty("Time is required"),
  portion: z
    .string()
    .nonempty("Portion size is required")
    .transform((val) => `${val}g`),
  frequency: z.enum(["daily", "custom", "specific"], { required_error: "Frequency is required" }),
  notes: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export default function Schedule() {
  const navigate = useNavigate();
  const { schedules, fetchSchedules, addSchedule, updateSchedule, deleteSchedule } = useScheduleStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [automatedFeeding, setAutomatedFeeding] = useState(true);
  const [manualReminders, setManualReminders] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all");
  const [sortBy, setSortBy] = useState<"time" | "frequency">("time");
  const [recentFeeds, setRecentFeeds] = useState<Feed[]>([]);

  const [addDays, setAddDays] = useState<string[]>([]);
  const [editDays, setEditDays] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<"Active" | "Paused">("Active");

  const addForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { time: "", portion: "", frequency: "daily", notes: "" },
    mode: "onChange",
  });

  const editForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { time: "", portion: "", frequency: "daily", notes: "" },
    mode: "onChange",
  });

  useEffect(() => {
    fetchSchedules();
    fetchRecentFeeds();
  }, [fetchSchedules]);

  const fetchRecentFeeds = async () => {
    try {
      const response = await fetch(`${API_URL}/api/feed-log`);
      if (!response.ok) throw new Error("Failed to fetch feed logs");
      const data: Feed[] = await response.json();
      setRecentFeeds(data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch recent feeds:", error);
      toast.error("Failed to load recent feeds.");
    }
  };

  useEffect(() => {
    if (currentSchedule) {
      setEditStatus(currentSchedule.status);
      setEditDays(currentSchedule.days || []);
      editForm.reset({
        time: currentSchedule.time,
        portion: currentSchedule.portion.replace("g", ""),
        frequency: currentSchedule.frequency,
        notes: currentSchedule.notes || "",
      });
    }
  }, [currentSchedule, editForm]);

  const filteredSchedules = schedules.filter((schedule) =>
    filterStatus === "all" ? true : schedule.status.toLowerCase() === filterStatus.toLowerCase()
  );
  const sortedSchedules = [...filteredSchedules].sort((a, b) =>
    sortBy === "time" ? a.time.localeCompare(b.time) : a.frequency.localeCompare(b.frequency)
  );

  const handleAddSchedule = async (data: ScheduleFormData) => {
    const days =
      data.frequency === "daily" ? daysOfWeek.map((day) => day.label) : data.frequency === "specific" ? addDays : [];
    const newSchedule: Schedule = { ...data, days, status: "Active" };
    try {
      await addSchedule(newSchedule);
      setAddDialogOpen(false);
      setAddDays([]);
      addForm.reset();
    } catch (error) {
      console.error("Failed to add schedule:", error);
      toast.error("Failed to add schedule. Please try again.");
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setCurrentSchedule(schedule);
    setEditDialogOpen(true);
  };

  const handleEditScheduleSubmit = async (data: ScheduleFormData) => {
    const days =
      data.frequency === "daily" ? daysOfWeek.map((day) => day.label) : data.frequency === "specific" ? editDays : [];
    const updatedSchedule: Schedule = { ...data, days, status: editStatus };
    try {
      if (currentSchedule?._id) {
        await updateSchedule(currentSchedule._id, updatedSchedule);
      }
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update schedule:", error);
      toast.error("Failed to update schedule. Please try again.");
    }
  };

  const confirmDeleteSchedule = (id: string) => {
    setScheduleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSchedule = async () => {
    if (scheduleToDelete) {
      try {
        await deleteSchedule(scheduleToDelete);
      } catch (error) {
        console.error("Failed to delete schedule:", error);
        toast.error("Failed to delete schedule. Please try again.");
      } finally {
        setDeleteDialogOpen(false);
        setScheduleToDelete(null);
      }
    }
  };

  const handleAddDayChange = (day: string, checked: boolean) =>
    setAddDays((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)));
  const handleEditDayChange = (day: string, checked: boolean) =>
    setEditDays((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)));

  return (
    <Layout
      currentPath="/schedule"
      navigateTo={navigate}
      title="Feed Schedule"
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Current Feeding Schedule</CardTitle>
                <CardDescription>Manage your pet's feeding times</CardDescription>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={addForm.handleSubmit(handleAddSchedule)}>
                    <DialogHeader>
                      <DialogTitle>Add New Feeding Schedule</DialogTitle>
                      <DialogDescription>Create a new scheduled feeding time for your pet.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="time">Time</Label>
                        <Controller
                          name="time"
                          control={addForm.control}
                          render={({ field }) => (
                            <Input
                              id="time"
                              type="time"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                addForm.trigger("time");
                              }}
                            />
                          )}
                        />
                        {addForm.formState.errors.time && (
                          <p className="text-sm text-red-500">{addForm.formState.errors.time.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="portion">Portion Size (grams)</Label>
                        <Controller
                          name="portion"
                          control={addForm.control}
                          render={({ field }) => (
                            <Input
                              id="portion"
                              type="number"
                              min="1"
                              placeholder="100"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                addForm.trigger("portion");
                              }}
                            />
                          )}
                        />
                        {addForm.formState.errors.portion && (
                          <p className="text-sm text-red-500">{addForm.formState.errors.portion.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Controller
                          name="frequency"
                          control={addForm.control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                addForm.trigger("frequency");
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="custom">Every X Hours</SelectItem>
                                <SelectItem value="specific">Specific Days</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {addForm.formState.errors.frequency && (
                          <p className="text-sm text-red-500">{addForm.formState.errors.frequency.message}</p>
                        )}
                      </div>
                      {addForm.watch("frequency") === "specific" && (
                        <div className="grid gap-2">
                          <Label>Days of Week</Label>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <div key={day.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={day.id}
                                  checked={addDays.includes(day.label)}
                                  onCheckedChange={(checked) => handleAddDayChange(day.label, checked as boolean)}
                                />
                                <Label htmlFor={day.id} className="text-sm font-normal">{day.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Controller
                          name="notes"
                          control={addForm.control}
                          render={({ field }) => (
                            <Input id="notes" placeholder="Add any additional information" {...field} />
                          )}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                        Save
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Label>Sort by:</Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as "time" | "frequency")}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time</SelectItem>
                      <SelectItem value="frequency">Frequency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Filter:</Label>
                  <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | "active" | "paused")}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {sortedSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <CalendarX className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500 text-lg">No schedule added yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Portion Size</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSchedules.map((schedule) => (
                      <TableRow key={schedule._id}>
                        <TableCell className="font-medium">{schedule.time}</TableCell>
                        <TableCell>{schedule.portion}</TableCell>
                        <TableCell>{schedule.frequency}</TableCell>
                        <TableCell>
                          <Badge
                            variant={schedule.status === "Active" ? "outline" : "secondary"}
                            className={
                              schedule.status === "Active"
                                ? "bg-green-100 text-green-600 hover:bg-green-200 border-green-200"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {schedule.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditSchedule(schedule)}>
                              <Settings className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDeleteSchedule(schedule._id!)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Automated Feeds</CardTitle>
              <CardDescription>History of recent automated feeding events</CardDescription>
            </CardHeader>
            <CardContent>
              {recentFeeds.length === 0 ? (
                <p className="text-gray-500">No recent feeds available.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Portion</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFeeds.map((feed) => (
                      <TableRow key={feed._id}>
                        <TableCell>{feed.date}</TableCell>
                        <TableCell>{feed.time}</TableCell>
                        <TableCell>{feed.portion}</TableCell>
                        <TableCell>
                          <Badge
                            variant={feed.status === "Successful" ? "outline" : "destructive"}
                            className={
                              feed.status === "Successful"
                                ? "bg-green-100 text-green-600 hover:bg-green-200 border-green-200"
                                : "bg-red-100 text-red-600 hover:bg-red-200 border-red-200"
                            }
                          >
                            {feed.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate("/history")}>
                View All History
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Automated Feeding</CardTitle>
              <CardDescription>Control automatic feeding settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Automated Feeding</Label>
                  <p className="text-sm text-gray-500">Automatically dispense food based on the set schedule</p>
                </div>
                <Switch checked={automatedFeeding} onCheckedChange={setAutomatedFeeding} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Manual Feeding Reminders</CardTitle>
              <CardDescription>Get notified when it's time to feed your pet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Reminders</Label>
                  <p className="text-sm text-gray-500">Receive reminders if no feeding has occurred</p>
                </div>
                <Switch checked={manualReminders} onCheckedChange={setManualReminders} />
              </div>
              <div className="space-y-2">
                <Label>Reminder Frequency</Label>
                <Select defaultValue="4">
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Every 2 hours</SelectItem>
                    <SelectItem value="4">Every 4 hours</SelectItem>
                    <SelectItem value="6">Every 6 hours</SelectItem>
                    <SelectItem value="8">Every 8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Save Preferences</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Schedule Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-orange-500 shrink-0" />
                <p className="text-sm">Feeding your pet at consistent times helps maintain their health.</p>
              </div>
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-orange-500 shrink-0" />
                <p className="text-sm">Adjust portion sizes based on your pet's age and activity level.</p>
              </div>
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-orange-500 shrink-0" />
                <p className="text-sm">For cats, multiple small meals throughout the day may be better than fewer large meals.</p>
              </div>
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-orange-500 shrink-0" />
                <p className="text-sm">Consider your pet's natural eating patterns when setting up the schedule.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={editForm.handleSubmit(handleEditScheduleSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Feeding Schedule</DialogTitle>
              <DialogDescription>Modify the existing feeding schedule.</DialogDescription>
            </DialogHeader>
            {currentSchedule && (
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Controller
                    name="time"
                    control={editForm.control}
                    render={({ field }) => (
                      <Input
                        id="edit-time"
                        type="time"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          editForm.trigger("time");
                        }}
                      />
                    )}
                  />
                  {editForm.formState.errors.time && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.time.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-portion">Portion Size (grams)</Label>
                  <Controller
                    name="portion"
                    control={editForm.control}
                    render={({ field }) => (
                      <Input
                        id="edit-portion"
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          editForm.trigger("portion");
                        }}
                      />
                    )}
                  />
                  {editForm.formState.errors.portion && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.portion.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-frequency">Frequency</Label>
                  <Controller
                    name="frequency"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          editForm.trigger("frequency");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="custom">Every X Hours</SelectItem>
                          <SelectItem value="specific">Specific Days</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {editForm.formState.errors.frequency && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.frequency.message}</p>
                  )}
                </div>
                {editForm.watch("frequency") === "specific" && (
                  <div className="grid gap-2">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <div key={`edit-${day.id}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${day.id}`}
                            checked={editDays.includes(day.label)}
                            onCheckedChange={(checked) => handleEditDayChange(day.label, checked as boolean)}
                          />
                          <Label htmlFor={`edit-${day.id}`} className="text-sm font-normal">{day.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notes (Optional)</Label>
                  <Controller
                    name="notes"
                    control={editForm.control}
                    render={({ field }) => (
                      <Input id="edit-notes" placeholder="Add any additional information" {...field} />
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="status"
                      checked={editStatus === "Active"}
                      onCheckedChange={(checked) => setEditStatus(checked ? "Active" : "Paused")}
                    />
                    <Label className="text-sm font-normal">{editStatus}</Label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSchedule}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}