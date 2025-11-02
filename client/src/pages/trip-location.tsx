import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation, useParams } from "wouter";
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Home as HomeIcon,
  Navigation,
  Edit2,
  X,
  Clock,
  Map,
  ImagePlus,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  start: "Start",
  stop: "Stop",
  destination: "Destination",
};

const typeColors: Record<string, string> = {
  start: "bg-emerald-500",
  stop: "bg-sky-500",
  destination: "bg-purple-500",
};

export default function TripLocation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [stopName, setStopName] = useState("");
  const [stopTime, setStopTime] = useState("");
  const [travelMethod, setTravelMethod] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [accommodationDetails, setAccommodationDetails] = useState("");
  const [stopImage, setStopImage] = useState<string>("");
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [pinType, setPinType] = useState<"start" | "stop" | "destination">("stop");
  const [gpsLoading, setGpsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: trip } = useQuery({
    queryKey: ["/api/trips", id],
    queryFn: () => apiRequest(`/api/trips/${id}`),
  });

  const { data: stops = [] } = useQuery({
    queryKey: ["/api/trips", id, "stops"],
    queryFn: () => apiRequest(`/api/trips/${id}/stops`),
  });

  const { data: memberLocations = [] } = useQuery({
    queryKey: ["/api/trips", id, "locations"],
    queryFn: () => apiRequest(`/api/trips/${id}/locations`),
    refetchInterval: 5000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/trips", id, "members"],
    queryFn: () => apiRequest(`/api/trips/${id}/members`),
  });

  const addStopMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/trips/${id}/stops`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "stops"] });
      resetForm();
      toast({ title: "Stop added successfully" });
    },
  });

  const updateStopMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/trips/${id}/stops/${editingStopId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "stops"] });
      resetForm();
      setEditingStopId(null);
      toast({ title: "Stop updated successfully" });
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: (stopId: string) =>
      apiRequest(`/api/trips/${id}/stops/${stopId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "stops"] });
      toast({ title: "Stop deleted successfully" });
    },
  });

  const gpsTrackingMutation = useMutation({
    mutationFn: (coords: { latitude: number; longitude: number; accuracy?: number }) =>
      apiRequest(`/api/trips/${id}/location/gps`, {
        method: "POST",
        body: JSON.stringify({
          ...coords,
          timestamp: new Date(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id, "locations"] });
      toast({ title: "Location shared successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to share location", description: error.message, variant: "destructive" });
    },
  });

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setStopImage("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setStopImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setStopName("");
    setStopTime("");
    setTravelMethod("");
    setAccommodation("");
    setAccommodationDetails("");
    setStopImage("");
    setPinType("stop");
    setEditingStopId(null);
  };

  const handleEditStop = (stop: any) => {
    setEditingStopId(stop._id);
    setStopName(stop.name);
    setStopTime(stop.time || "");
    setTravelMethod(stop.travelMethod || "");
    setAccommodation(stop.accommodation || "");
    setAccommodationDetails(stop.accommodationDetails || "");
    setStopImage(stop.imageData || "");
    setPinType((stop.type as "start" | "stop" | "destination") || "stop");
  };

  const handleAddOrUpdateStop = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: stopName,
      travelMethod,
      accommodation,
      accommodationDetails,
      imageData: stopImage || undefined,
      time: stopTime,
      type: pinType,
      orderIndex: editingStopId ? undefined : stops.length,
    };

    if (editingStopId) {
      updateStopMutation.mutate(data);
    } else {
      addStopMutation.mutate(data);
    }
  };

  const handleShareGPS = () => {
    setGpsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          gpsTrackingMutation.mutate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setGpsLoading(false);
        },
        (error) => {
          toast({
            title: "GPS Error",
            description: error.message || "Failed to get location",
            variant: "destructive",
          });
          setGpsLoading(false);
        }
      );
    } else {
      toast({
        title: "GPS Not Available",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      setGpsLoading(false);
    }
  };

  const itineraryStops = stops as Array<any>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/home")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="font-serif text-2xl font-bold" data-testid="text-trip-name">
                {trip?.name || "Trip"}
              </h1>
              <p className="text-sm text-muted-foreground">{trip?.location}</p>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {members.map((member: any) => (
                    <span
                      key={member._id}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {member.userId?.username || "Member"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button onClick={() => navigate(`/trip/${id}/budget`)} data-testid="button-continue-budget">
            Continue to Budget
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingStopId ? "Edit Location" : "Add Trip Location"}
              </h2>
              <form onSubmit={handleAddOrUpdateStop} className="space-y-4">
                <div>
                  <Label htmlFor="stopType">Location Type *</Label>
                  <Select value={pinType} onValueChange={(value) => setPinType(value as "start" | "stop" | "destination")}
                    required
                  >
                    <SelectTrigger data-testid="select-location-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Start</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                      <SelectItem value="destination">Destination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stopName">Location Name *</Label>
                  <Input
                    id="stopName"
                    value={stopName}
                    onChange={(e) => setStopName(e.target.value)}
                    placeholder="e.g., City Center"
                    required
                    data-testid="input-stop-name"
                  />
                </div>

                <div>
                  <Label htmlFor="stopImage">Location Image</Label>
                  <Input
                    ref={fileInputRef}
                    id="stopImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                    data-testid="input-stop-image"
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageButtonClick}
                      className="flex items-center gap-2"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {stopImage ? "Change Image" : "Upload Image"}
                    </Button>
                    {stopImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleImageChange(null)}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {stopImage && (
                    <div className="mt-3">
                      <img
                        src={stopImage}
                        alt={stopName || "Location preview"}
                        className="h-32 w-full rounded-lg object-cover border"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="stopTime">Time *</Label>
                  <Input
                    id="stopTime"
                    type="time"
                    value={stopTime}
                    onChange={(e) => setStopTime(e.target.value)}
                    required
                    data-testid="input-stop-time"
                  />
                </div>

                <div>
                  <Label htmlFor="travelMethod">Travel Method</Label>
                  <Select value={travelMethod} onValueChange={setTravelMethod}>
                    <SelectTrigger data-testid="select-travel-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="plane">Plane</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="walking">Walking</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accommodation">Accommodation Type</Label>
                  <Select value={accommodation} onValueChange={setAccommodation}>
                    <SelectTrigger data-testid="select-accommodation">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="hostel">Hostel</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {accommodation && accommodation !== "none" && (
                  <div>
                    <Label htmlFor="accommodationDetails">Accommodation Details</Label>
                    <Input
                      id="accommodationDetails"
                      value={accommodationDetails}
                      onChange={(e) => setAccommodationDetails(e.target.value)}
                      placeholder="Name, address, or booking info"
                      data-testid="input-accommodation-details"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    data-testid="button-add-stop"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingStopId ? "Update Location" : "Add Location"}
                  </Button>
                  {editingStopId && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={resetForm}
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Route Diagram</h2>
              {itineraryStops.length === 0 ? (
                <div className="rounded-lg bg-muted p-6 text-center text-muted-foreground">
                  Add your starting point, stops, and destination to build a visual route.
                </div>
              ) : (
                <div className="pl-4">
                  <div className="ml-1 h-full w-px bg-border" />
                  <div className="space-y-6">
                    {itineraryStops.map((stop: any, index: number) => (
                      <div key={stop._id || index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className={`w-4 h-4 rounded-full ${typeColors[stop.type as string] || "bg-primary"}`} />
                          {index < itineraryStops.length - 1 && <span className="flex-1 w-px bg-border" />}
                        </div>
                        <div className="flex-1 rounded-lg border bg-background/80 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="uppercase tracking-wide text-xs">
                              {typeLabels[stop.type as string] || "Stop"}
                            </Badge>
                            <h3 className="text-lg font-semibold" data-testid="text-diagram-stop-name">
                              {stop.name}
                            </h3>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {stop.time && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{stop.time}</span>
                              </div>
                            )}
                            {stop.travelMethod && (
                              <p>Travel: <span className="capitalize">{stop.travelMethod}</span></p>
                            )}
                            {stop.accommodation && stop.accommodation !== "none" && (
                              <p>
                                <HomeIcon className="w-3 h-3 inline mr-1" />
                                {stop.accommodation}
                                {stop.accommodationDetails && ` - ${stop.accommodationDetails}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <h2 className="text-xl font-semibold mb-4">Live Map Preview</h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-primary/40 bg-background/40 p-6 text-center text-sm text-muted-foreground">
                  Live map visualization is coming soon. Your added locations will appear here as a styled route overview.
                </div>
                <div className="flex items-center justify-center gap-3 text-muted-foreground text-sm">
                  <Map className="w-4 h-4" />
                  <span>Interactive map coming soon</span>
                </div>
                <Button
                  onClick={handleShareGPS}
                  disabled={gpsLoading}
                  className="w-full"
                  variant="outline"
                  data-testid="button-share-gps"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {gpsLoading ? "Getting location..." : "Share Live Location"}
                </Button>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Start
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Stops
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    Destination
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Trip Locations ({stops.length})</h2>
            {stops.length === 0 ? (
              <Card className="p-8 text-center">
                <Map className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No locations added yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {stops.map((stop: any, index: number) => (
                  <Card key={stop._id} className="p-4" data-testid={`card-stop-${stop._id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold" data-testid="text-stop-name">{stop.name}</h3>
                          <Badge variant="secondary" className="mt-1 uppercase text-[10px] tracking-wide">
                            {typeLabels[stop.type as string] || "Stop"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditStop(stop)}
                          data-testid="button-edit-stop"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteStopMutation.mutate(stop._id)}
                          data-testid="button-delete-stop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {stop.time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{stop.time}</span>
                        </div>
                      )}
                      {stop.travelMethod && (
                        <p>Travel: <span className="capitalize">{stop.travelMethod}</span></p>
                      )}
                      {stop.accommodation && stop.accommodation !== "none" && (
                        <p>
                          <HomeIcon className="w-3 h-3 inline mr-1" />
                          {stop.accommodation}
                          {stop.accommodationDetails && ` - ${stop.accommodationDetails}`}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {memberLocations.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mb-4 mt-8">Live Member Locations</h2>
                <div className="space-y-2">
                  {memberLocations.map((location: any) => (
                    <Card key={`${location.userId}-${location.createdAt}`} className="p-3 bg-red-500/5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <p className="font-medium">{location.userId?.username || "User"}</p>
                          <p className="text-xs text-muted-foreground">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ±{location.accuracy?.toFixed(0) || "N/A"}m
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
