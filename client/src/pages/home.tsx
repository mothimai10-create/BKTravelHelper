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
import { Plus, MapPin, Calendar, Users, IndianRupee, Trash2, Edit, LogOut, MessageSquare, Bell, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MemberManager } from "@/components/member-manager";
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold" data-testid="text-app-title">BKTravel Helper</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              data-testid="button-notifications"
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setChatOpen(!chatOpen)}
              data-testid="button-chatbot"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
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
                  className="w-full justify-start"
                  onClick={() => navigate('/home')}
                  data-testid="button-my-trips"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  My Trips
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setJoinDialogOpen(true)}
                  data-testid="button-join-trip"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Join Budget Split
                </Button>
              </div>
            </Card>
          </div>

          <div className="md:col-span-3">
            <Card className="p-8 mb-6 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Create a New Trip</h2>
                <p className="text-muted-foreground mb-6">Start planning your next adventure</p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/create-trip')}
                  data-testid="button-create-trip"
                >
                  <Plus className="w-5 h-5 mr-2" />
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
  return (
    <Card 
      className="overflow-hidden hover-elevate cursor-pointer"
      data-testid={`card-trip-${trip._id}`}
      onClick={() => navigate(`/trip/${trip._id}/dashboard`)}
    >
      <div 
        className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
      >
        <MapPin className="w-12 h-12 text-primary" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold" data-testid="text-trip-name">{trip.name}</h3>
          <Badge variant={trip.status === 'current' ? 'default' : 'secondary'}>{trip.status}</Badge>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{trip.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(trip.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{trip.numberOfMembers} members</span>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4" />
            <span>₹{trip.totalBudget}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono uppercase tracking-wide">
              {trip.joinCode}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/trip/${trip._id}/location`);
            }}
            data-testid="button-view-trip"
          >
            <MapPin className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/trip/${trip._id}/spending`);
            }}
            data-testid="button-spending"
          >
            <IndianRupee className="w-4 h-4 mr-1" />
            Spending
          </Button>
          {isOrganizer && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/trip/${trip._id}/edit`);
                }}
                data-testid="button-edit-trip"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <div onClick={(e) => e.stopPropagation()}>
                <MemberManager tripId={trip._id} isOrganizer={isOrganizer} />
              </div>
            </>
          )}
          <Button 
            size="sm" 
            variant="outline"
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
