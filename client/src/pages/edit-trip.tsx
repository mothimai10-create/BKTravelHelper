import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function EditTrip() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numberOfMembers, setNumberOfMembers] = useState("1");
  const [totalBudget, setTotalBudget] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: trip, isLoading } = useQuery({
    queryKey: ['/api/trips', id],
    queryFn: () => apiRequest(`/api/trips/${id}`),
  });

  useEffect(() => {
    if (trip) {
      setName(trip.name);
      setLocation(trip.location);
      setStartDate(trip.startDate?.split('T')[0] || "");
      setEndDate(trip.endDate?.split('T')[0] || "");
      setNumberOfMembers(trip.numberOfMembers?.toString() || "1");
      setTotalBudget(trip.totalBudget?.toString() || "");
    }
  }, [trip]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          location,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          numberOfMembers: parseInt(numberOfMembers),
          totalBudget,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({ title: "Trip updated successfully" });
      navigate('/home');
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update trip", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/trips/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({ title: "Trip deleted successfully" });
      navigate('/home');
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete trip", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading trip...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/home')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8">
          <h1 className="font-serif text-3xl font-bold mb-2" data-testid="text-page-title">
            Edit Trip
          </h1>
          <p className="text-muted-foreground mb-8">
            Update your trip details
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Trip Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Beach Vacation"
                required
                data-testid="input-trip-name"
              />
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Bali, Indonesia"
                required
                data-testid="input-location"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  data-testid="input-start-date"
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfMembers">Number of Members *</Label>
                <Input
                  id="numberOfMembers"
                  type="number"
                  min="1"
                  value={numberOfMembers}
                  onChange={(e) => setNumberOfMembers(e.target.value)}
                  required
                  data-testid="input-members"
                />
              </div>

              <div>
                <Label htmlFor="totalBudget">Total Budget</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="e.g., 5000"
                  data-testid="input-budget"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <Button 
                type="submit" 
                size="lg"
                disabled={updateMutation.isPending}
                className="flex-1"
                data-testid="button-save"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                type="button"
                size="lg"
                variant="destructive"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this trip? This cannot be undone.')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                data-testid="button-delete"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? "Deleting..." : "Delete Trip"}
              </Button>
            </div>
          </form>
        </Card>

        {trip && (
          <Card className="p-6 mt-6 bg-muted/50">
            <h3 className="font-semibold mb-3">Trip Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{trip.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Join Code</p>
                <p className="font-mono font-medium">{trip.joinCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(trip.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Organizer</p>
                <p className="font-medium">@{trip.organizerId?.userId}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}