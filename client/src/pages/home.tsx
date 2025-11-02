import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Plus, MapPin, Calendar, Users, IndianRupee, Trash2, Edit, LogOut, MessageSquare, Bell, Sun, Moon, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MemberManager } from "@/components/member-manager";
import { HeaderIcon, ProfessionalIcon } from "@/components/professional-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [, navigate] = useLocation();
  const { user, clearUser } = useAuth();
  const { toast } = useToast();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: string; content: string}>>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const { data: trips = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/trips'],
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const deleteMutation = useMutation({
    mutationFn: (tripId: string) => apiRequest(`/api/trips/${tripId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({ title: "Trip deleted successfully" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => apiRequest('/api/trips/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode: code }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      setJoinDialogOpen(false);
      setJoinCode("");
      toast({ title: "Joined trip successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to join trip", description: error.message, variant: "destructive" });
    },
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) => apiRequest('/api/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, 
        { role: 'user', content: chatMessage },
        { role: 'assistant', content: data.response }
      ]);
      setChatMessage("");
    },
  });

  const handleLogout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    clearUser();
    navigate('/');
  };

  const upcomingTrips = trips.filter((t: any) => t.status === 'upcoming' && t.organizerId?._id === user?.id);
  const currentTrips = trips.filter((t: any) => t.status === 'current');
  const pastTrips = trips.filter((t: any) => t.status === 'past');

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-background">
      <header className="border-b bg-gradient-header-blue shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/logo.png" alt="BKTravel Helper" className="h-12 w-auto" data-testid="text-app-title" />
          <div className="flex items-center gap-2">
            <HeaderIcon 
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </HeaderIcon>
            <HeaderIcon 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              count={unreadCount}
              data-testid="button-notifications"
            >
              <Bell />
            </HeaderIcon>
            <HeaderIcon 
              onClick={() => setChatOpen(!chatOpen)}
              data-testid="button-chatbot"
            >
              <MessageSquare />
            </HeaderIcon>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              data-testid="button-logout"
              className="text-white hover:bg-white/20 transition-all duration-200 hover:shadow-md"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card className="p-6" data-testid="card-user-profile">
              <div className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold" data-testid="text-username">{user.username}</h2>
                <p className="text-sm text-muted-foreground" data-testid="text-userid">@{user.userId}</p>
              </div>

              <div className="mt-6 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => navigate('/home')}
                  data-testid="button-my-trips"
                >
                  <MapPin className="w-4 h-4 mr-3 text-blue-600" />
                  <span className="font-medium">My Trips</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-purple-50 transition-colors duration-200"
                  onClick={() => setJoinDialogOpen(true)}
                  data-testid="button-join-trip"
                >
                  <Users className="w-4 h-4 mr-3 text-purple-600" />
                  <span className="font-medium">Join Budget Split</span>
                </Button>
              </div>
            </Card>
          </div>

          <div className="md:col-span-3">
            <Card className="p-8 mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2 text-blue-900">Create a New Trip</h2>
                <p className="text-blue-700 mb-6 font-medium">Start planning your next adventure</p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/create-trip')}
                  data-testid="button-create-trip"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-2 font-bold" />
                  Create Trip
                </Button>
              </div>
            </Card>

            {isLoading ? (
              <div className="text-center py-12">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
                <p className="text-muted-foreground">Create your first trip to get started!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {currentTrips.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Current Trips</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {currentTrips.map((trip: any) => (
                        <TripCard 
                          key={trip._id} 
                          trip={trip} 
                          onDelete={deleteMutation.mutate} 
                          navigate={navigate}
                          isOrganizer={trip.organizerId?._id === user?.id || trip.organizerId === user?.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {upcomingTrips.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Upcoming Trips</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {upcomingTrips.map((trip: any) => (
                        <TripCard 
                          key={trip._id} 
                          trip={trip} 
                          onDelete={deleteMutation.mutate} 
                          navigate={navigate}
                          isOrganizer={trip.organizerId?._id === user?.id || trip.organizerId === user?.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pastTrips.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Past Trips</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {pastTrips.map((trip: any) => (
                        <TripCard 
                          key={trip._id} 
                          trip={trip} 
                          onDelete={deleteMutation.mutate} 
                          navigate={navigate}
                          isOrganizer={trip.organizerId?._id === user?.id || trip.organizerId === user?.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent data-testid="dialog-join-trip">
          <DialogHeader>
            <DialogTitle>Join a Trip</DialogTitle>
            <DialogDescription>
              Enter the join code shared by the trip organizer
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="joinCode">Join Code</Label>
            <Input
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              maxLength={8}
              className="font-mono text-lg"
              data-testid="input-join-code"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => joinMutation.mutate(joinCode)} 
              disabled={joinCode.length !== 8}
              data-testid="button-join-submit"
            >
              Join Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {notificationsOpen && (
        <Card className="fixed bottom-4 right-4 w-96 max-h-[500px] flex flex-col shadow-2xl" data-testid="card-notifications">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <Button variant="ghost" size="icon" onClick={() => setNotificationsOpen(false)}>×</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notifications yet
              </p>
            ) : (
              notifications.map((notif: any) => (
                <Card 
                  key={notif._id} 
                  className={`p-3 ${notif.read ? 'opacity-60' : 'bg-accent'}`}
                  data-testid={`card-notification-${notif._id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm" data-testid="text-notif-title">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      )}

      {chatOpen && (
        <Card className="fixed bottom-4 right-4 w-96 h-[500px] flex flex-col shadow-2xl" data-testid="card-chatbot">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Travel Assistant</h3>
            <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>×</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ask me about your trips, budgets, or travel plans!
              </p>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about your trips..."
                onKeyPress={(e) => e.key === 'Enter' && chatMessage && chatMutation.mutate(chatMessage)}
                data-testid="input-chat-message"
              />
              <Button 
                onClick={() => chatMessage && chatMutation.mutate(chatMessage)}
                disabled={!chatMessage || chatMutation.isPending}
                data-testid="button-send-chat"
              >
                Send
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function TripCard({ trip, onDelete, navigate, isOrganizer }: any) {
  const { toast } = useToast();
  
  const startTripMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/trips/${trip._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'current' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({ 
        title: "Trip Started! 🎉", 
        description: "Trip is now active. All members have been notified." 
      });
      // Auto-navigate to dashboard after successful trip start
      navigate(`/trip/${trip._id}/dashboard`);
    },
    onError: () => {
      toast({ 
        title: "Failed to start trip", 
        description: "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleStartTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTripMutation.mutate();
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500 hover:border-l-blue-600"
      data-testid={`card-trip-${trip._id}`}
      onClick={() => navigate(`/trip/${trip._id}/dashboard`)}
    >
      <div 
        className="h-28 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-blue-500 to-cyan-500" />
        <ProfessionalIcon size="lg" background bgColor="primary">
          <MapPin className="w-6 h-6" />
        </ProfessionalIcon>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800" data-testid="text-trip-name">{trip.name}</h3>
          <Badge variant={trip.status === 'current' ? 'default' : 'secondary'} className="text-xs font-semibold">
            {trip.status === 'current' ? '🔴 Live' : '⏰ Upcoming'}
          </Badge>
        </div>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-medium">{trip.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="font-medium">{new Date(trip.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="font-medium">{trip.numberOfMembers} members</span>
          </div>
          <div className="flex items-center gap-3">
            <IndianRupee className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-bold text-lg">₹{trip.totalBudget}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <Badge variant="secondary" className="font-mono uppercase tracking-widest text-xs font-bold bg-gray-100 text-gray-700">
              🔐 {trip.joinCode}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap pt-2">
          {isOrganizer && trip.status === 'upcoming' && (
            <Button 
              size="sm" 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all"
              onClick={handleStartTrip}
              disabled={startTripMutation.isPending}
              data-testid="button-start-trip"
            >
              <Play className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {startTripMutation.isPending ? 'Starting...' : 'Start Trip'}
              </span>
            </Button>
          )}
          <Button 
            size="sm" 
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/trip/${trip._id}/location`);
            }}
            data-testid="button-view-trip"
          >
            <MapPin className="w-4 h-4 mr-1" />
            <span className="font-medium">View</span>
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/trip/${trip._id}/spending`);
            }}
            data-testid="button-spending"
          >
            <IndianRupee className="w-4 h-4 mr-1" />
            <span className="font-medium">Budget</span>
          </Button>
          {isOrganizer && (
            <>
              <Button 
                size="sm" 
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white shadow-md hover:shadow-lg transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/trip/${trip._id}/edit`);
                }}
                data-testid="button-edit-trip"
              >
                <Edit className="w-4 h-4 mr-1" />
                <span className="font-medium">Edit</span>
              </Button>
              <div onClick={(e) => e.stopPropagation()}>
                <MemberManager tripId={trip._id} isOrganizer={isOrganizer} />
              </div>
            </>
          )}
          <Button 
            size="sm" 
            variant="destructive"
            className="shadow-md hover:shadow-lg transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(trip._id);
            }}
            data-testid="button-delete-trip"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
