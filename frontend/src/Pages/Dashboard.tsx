"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import { StatusCard } from "@/components/status-card"
import { CircularProgress } from "@/components/circular-progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { CircleIcon, Clock, Utensils } from "lucide-react"
import { toast } from "react-hot-toast"
import { API_URL, ESP32_IP } from "@/config"
import { useNavigate } from "react-router-dom"

interface Feed {
  _id: string;
  date: string;
  time: string;
  portion: string;
  method: "Manual" | "Scheduled" | "Manual-Button";
  status: "Successful" | "Failed";
}

interface Schedule {
  _id: string;
  time: string;
  portion: string;
  frequency: "daily" | "custom" | "specific";
  status: "Active" | "Paused";
  days?: string[];
}

interface MonthlyData {
  name: string;
  grams: number;
}

export default function Dashboard() {
  const [foodLevel, setFoodLevel] = useState(75)
  const [distance, setDistance] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [recentFeeds, setRecentFeeds] = useState<Feed[]>([])
  const [nextFeeding, setNextFeeding] = useState<{ time: string; date: string } | null>(null)
  const [totalDispensedToday, setTotalDispensedToday] = useState<number>(0)
  const [monthlyFeedingData, setMonthlyFeedingData] = useState<MonthlyData[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchFoodLevel = async () => {
      try {
        const response = await fetch(`http://${ESP32_IP}/foodLevel`);
        if (!response.ok) {
          throw new Error(`Failed to fetch food level: ${response.status}`);
        }
        const data = await response.json();
        setFoodLevel(Math.round(data.level));
        setDistance(data.distance);
        setLastUpdate(new Date().toLocaleTimeString());
        setError(null);
      } catch (error: unknown) {
        console.error('Error fetching food level:', error);
        setError('Failed to update food level');
      }
    };

    fetchFoodLevel();
    const interval = setInterval(fetchFoodLevel, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentFeeds = async () => {
    try {
      const response = await fetch(`${API_URL}/api/feed-log`);
      if (!response.ok) throw new Error('Failed to fetch feed logs');
      const data = await response.json();
      setRecentFeeds(data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recent feeds:', error);
      toast.error('Failed to load recent feeds');
    }
  };

  useEffect(() => {
    fetchRecentFeeds();
    const interval = setInterval(fetchRecentFeeds, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNextFeeding = async () => {
      try {
        const response = await fetch(`${API_URL}/api/schedule`);
        if (!response.ok) throw new Error('Failed to fetch schedules');
        const schedules: Schedule[] = await response.json();
        
        const activeSchedules = schedules.filter(s => s.status === "Active");
        
        if (activeSchedules.length === 0) {
          setNextFeeding(null);
          return;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        let nextTime: Date | null = null;
        
        for (const schedule of activeSchedules) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          const scheduleMinutes = hours * 60 + minutes;
          
          if (scheduleMinutes > currentTime) {
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);
            
            if (!nextTime || scheduleDate < nextTime) {
              nextTime = scheduleDate;
            }
          }
        }

        if (!nextTime && activeSchedules.length > 0) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const [hours, minutes] = activeSchedules[0].time.split(':').map(Number);
          tomorrow.setHours(hours, minutes, 0, 0);
          nextTime = tomorrow;
        }

        if (nextTime) {
          setNextFeeding({
            time: nextTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            date: nextTime.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })
          });
        }
      } catch (error) {
        console.error('Failed to fetch next feeding time:', error);
      }
    };

    fetchNextFeeding();
    const interval = setInterval(fetchNextFeeding, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculateTotalDispensedToday = async () => {
      try {
        const today = new Date();
        const todayString = today.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).split('/').reverse().join('-');

        console.log('Today\'s date:', todayString);

        const response = await fetch(`${API_URL}/api/feed-log`);
        if (!response.ok) throw new Error('Failed to fetch feed logs');
        const feeds: Feed[] = await response.json();
        
        console.log('All feeds:', feeds);
        
        const todayFeeds = feeds.filter(feed => {
          console.log('Comparing feed date:', feed.date, 'with today:', todayString);
          return feed.date === todayString && feed.status === "Successful";
        });

        console.log('Today\'s feeds:', todayFeeds);
        
        const total = todayFeeds.reduce((sum, feed) => {
          const grams = parseInt(feed.portion.replace('g', ''));
          return sum + (isNaN(grams) ? 0 : grams);
        }, 0);
        
        setTotalDispensedToday(total);
      } catch (error) {
        console.error('Failed to calculate total dispensed:', error);
      }
    };

    calculateTotalDispensedToday();
    const interval = setInterval(calculateTotalDispensedToday, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculateMonthlyData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/feed-log`);
        if (!response.ok) throw new Error('Failed to fetch feed logs');
        const feeds: Feed[] = await response.json();

        // Get all successful feeds
        const successfulFeeds = feeds.filter(feed => feed.status === "Successful");

        // Create a map to store monthly totals
        const monthlyTotals = new Map<string, number>();

        // Initialize all months with 0
        const months = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        months.forEach(month => monthlyTotals.set(month, 0));

        // Calculate totals for each month
        successfulFeeds.forEach(feed => {
          const date = new Date(feed.date);
          const month = months[date.getMonth()];
          const grams = parseInt(feed.portion.replace('g', ''));
          if (!isNaN(grams)) {
            monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + grams);
          }
        });

        // Convert to array format for the chart
        const monthlyData = months.map(month => ({
          name: month,
          grams: monthlyTotals.get(month) || 0
        }));

        setMonthlyFeedingData(monthlyData);
      } catch (error) {
        console.error('Failed to calculate monthly data:', error);
        toast.error('Failed to load monthly feeding data');
      }
    };

    calculateMonthlyData();
    const interval = setInterval(calculateMonthlyData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleFeedNow = async () => {
    const STANDARD_PORTION = 50;
    try {
      console.log(`Sending feed command to ESP32 at ${ESP32_IP}`);
      const feedResponse = await fetch(`http://${ESP32_IP}/feed?portion=${STANDARD_PORTION}`, {
        method: 'GET',
        headers: { 'Accept': 'text/plain' },
      });

      if (!feedResponse.ok) {
        const errorText = await feedResponse.text();
        throw new Error(`Failed to send feed command: ${errorText}`);
      }

      const feedText = await feedResponse.text();
      console.log('ESP32 response:', feedText);

      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).split('/').reverse().join('-');

      const logResponse = await fetch(`${API_URL}/api/feed-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formattedDate,
          time: now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          portion: `${STANDARD_PORTION}g`,
          method: "Manual",
          status: "Successful"
        })
      });

      if (!logResponse.ok) {
        throw new Error("Failed to log feed");
      }

      toast.success(`Manual feeding completed (${STANDARD_PORTION}g)!`);
      fetchRecentFeeds();
    } catch (error: unknown) {
      console.error("Error during feed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to feed: ${errorMessage}`);
      try {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).split('/').reverse().join('-');

        await fetch(`${API_URL}/api/feed-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: formattedDate,
            time: now.toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            portion: `${STANDARD_PORTION}g`,
            method: "Manual",
            status: "Failed"
          })
        });
      } catch (logError) {
        console.error("Failed to log failed attempt:", logError);
      }
    }
  };

  return (
    <Layout
      currentPath="/"
      navigateTo={navigate}
      title="Dashboard"
    >
      <div className="flex items-end justify-end gap-4 mb-2">
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleFeedNow}>
          Feed now
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatusCard
          icon={<CircleIcon className="h-5 w-5" />}
          title="Food Level"
          value={
            <div className="flex items-center">
              <CircularProgress 
                value={foodLevel} 
                size={90} 
                strokeWidth={8}
                className={foodLevel <= 20 ? "text-red-500" : foodLevel <= 60 ? "text-yellow-500" : "text-green-500"}
              />
              <div className="ml-4">
                <span className={`text-xl font-semibold ${foodLevel <= 20 ? "text-red-500" : foodLevel <= 60 ? "text-yellow-500" : "text-green-500"}`}>
                  {foodLevel}%
                </span>
                {distance !== null && (
                  <p className="text-sm text-gray-500">Distance: {distance.toFixed(1)}cm</p>
                )}
                {error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : (
                  <p className="text-sm text-gray-500">Updated: {lastUpdate}</p>
                )}
              </div>
            </div>
          }
          subtitle={
            foodLevel < 20 ? "Warning: Food level is low!" :
            foodLevel <= 60 ? "Food level is moderate" : "Food level is good"
          }
        />
        <StatusCard
          icon={<Clock className="h-5 w-5" />}
          title="Next Scheduled Feeding"
          value={nextFeeding ? nextFeeding.time : "No scheduled feeds"}
          subtitle={nextFeeding ? nextFeeding.date : "Add a schedule to see next feeding"}
        />
        <StatusCard
          icon={<Utensils className="h-5 w-5" />}
          title="Total food dispensed today"
          value={`${totalDispensedToday}g`}
          subtitle={`As of ${new Date().toLocaleTimeString()}`}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">Monthly Feeding Report</CardTitle>
            <CardDescription>Total food dispensed per month (in grams)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFeedingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="grams" fill="#FF7A5A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">Recent Activity Log</CardTitle>
            <CardDescription>History of recent feeding events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFeeds.map((feed) => (
                <div key={feed._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{feed.date}</div>
                    <div className="text-sm text-gray-500">{feed.time}</div>
                    <div className="text-xs text-gray-400">{feed.portion}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        feed.method === "Scheduled" ? "bg-purple-100 text-purple-600 hover:bg-purple-200 border-purple-200" :
                        feed.method === "Manual" ? "bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-200" :
                        feed.method === "Manual-Button" ? "bg-orange-100 text-orange-600 hover:bg-orange-200 border-orange-200" :
                        "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200"
                      }
                    >
                      {feed.method || "Unknown"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        feed.status === "Successful" ? "bg-green-100 text-green-600 hover:bg-green-200 border-green-200" :
                        "bg-red-100 text-red-600 hover:bg-red-200 border-red-200"
                      }
                    >
                      {feed.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/history")}>
              View All Activity
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  )
}