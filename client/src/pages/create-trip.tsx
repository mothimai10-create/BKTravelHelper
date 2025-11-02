import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function CreateTrip() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numberOfMembers, setNumberOfMembers] = useState("1");
  const [totalBudget, setTotalBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trip = await apiRequest('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || undefined,
          location,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          numberOfMembers: parseInt(numberOfMembers),
          totalBudget,
        }),
      });

      toast({ 
        title: "Trip created!", 
        description: `Join code: ${trip.joinCode}. Share this with your group.` 
      });
      navigate(`/trip/${trip._id}/location`);
    } catch (error: any) {
      toast({ 
        title: "Failed to create trip", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

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
            Create New Trip
          </h1>
          <p className="text-muted-foreground mb-8">
            Fill in the details to start planning your adventure
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
              <Label htmlFor="description">Trip Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional: Describe your trip itinerary, highlights, and any special notes..."
                className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md resize-vertical"
                rows={3}
                data-testid="input-trip-description"
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
                  min={startDate}
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
                  data-testid="input-number-of-members"
                />
              </div>

              <div>
                <Label htmlFor="totalBudget">Total Budget (₹) *</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="0.00"
                  required
                  data-testid="input-total-budget"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/home')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading}
                data-testid="button-create"
              >
                {loading ? "Creating..." : "Create Trip"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
