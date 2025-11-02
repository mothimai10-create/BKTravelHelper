import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueries } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import {
  ArrowLeft,
  Map,
  IndianRupee,
  Wallet,
  Users,
  RouteIcon,
  BarChart3,
  Calendar,
  Gauge,
} from "lucide-react";

export default function TripDashboard() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const queries = useQueries({
    queries: [
      {
        queryKey: ["/api/trips", id],
        queryFn: () => apiRequest(`/api/trips/${id}`),
      },
      {
        queryKey: ["/api/trips", id, "stops"],
        queryFn: () => apiRequest(`/api/trips/${id}/stops`),
      },
      {
        queryKey: ["/api/trips", id, "budget"],
        queryFn: () => apiRequest(`/api/trips/${id}/budget`),
      },
      {
        queryKey: ["/api/trips", id, "spending"],
        queryFn: () => apiRequest(`/api/trips/${id}/spending`),
      },
      {
        queryKey: ["/api/trips", id, "members"],
        queryFn: () => apiRequest(`/api/trips/${id}/members`),
      },
    ],
  });

  const [tripQuery, stopsQuery, budgetQuery, spendingQuery, membersQuery] = queries;
  const trip = tripQuery.data;
  const stops = stopsQuery.data || [];
  const budgetItems = budgetQuery.data || [];
  const spendingEntries = spendingQuery.data || [];
  const members = membersQuery.data || [];

  const loading = queries.some(query => query.isLoading);

  const totals = useMemo(() => {
    const totalBudget = Number(trip?.totalBudget || 0);
    const totalSpent = spendingEntries.reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);
    const totalAllocated = budgetItems.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    const balance = totalBudget - totalSpent;
    const progressSpent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
    const progressAllocated = totalBudget > 0 ? Math.min((totalAllocated / totalBudget) * 100, 100) : 0;
    return {
      totalBudget,
      totalSpent,
      totalAllocated,
      balance,
      progressSpent,
      progressAllocated,
    };
  }, [trip, spendingEntries, budgetItems]);

  const budgetByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const item of budgetItems) {
      const category = item.category || "Uncategorized";
      grouped[category] = (grouped[category] || 0) + Number(item.amount || 0);
    }
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [budgetItems]);

  const recentSpending = useMemo(() => {
    return [...spendingEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [spendingEntries]);

  const primaryStops = useMemo(() => {
    const start = stops.find((stop: any) => stop.type === "start");
    const destination = stops.find((stop: any) => stop.type === "destination");
    const middles = stops.filter((stop: any) => stop.type === "stop");
    return { start, destination, middles };
  }, [stops]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/home")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-bold">
                  {trip?.name || "Trip Dashboard"}
                </h1>
                {trip?.status && <Badge variant="secondary">{trip.status}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {trip?.location || ""}
              </p>
              {trip?.joinCode && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                  Join Code
                  <span className="font-mono text-sm">{trip.joinCode}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/trip/${id}/location`)}>
              <Map className="w-4 h-4 mr-2" />
              Locations
            </Button>
            <Button variant="outline" onClick={() => navigate(`/trip/${id}/budget`)}>
              <IndianRupee className="w-4 h-4 mr-2" />
              Budget
            </Button>
            <Button variant="outline" onClick={() => navigate(`/trip/${id}/spending`)}>
              <Wallet className="w-4 h-4 mr-2" />
              Spending
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<IndianRupee className="w-5 h-5" />}
            title="Total Budget"
            value={`₹${totals.totalBudget.toFixed(2)}`}
            loading={loading}
          />
          <MetricCard
            icon={<Wallet className="w-5 h-5" />}
            title="Total Spent"
            value={`₹${totals.totalSpent.toFixed(2)}`}
            loading={loading}
            subValue={`${totals.progressSpent.toFixed(0)}% of budget`}
          />
          <MetricCard
            icon={<Gauge className="w-5 h-5" />}
            title="Balance"
            value={`₹${totals.balance.toFixed(2)}`}
            loading={loading}
            subValue={totals.balance < 0 ? "Over budget" : "Available"}
            highlight={totals.balance < 0 ? "text-destructive" : "text-primary"}
          />
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            title="Members"
            value={members.length.toString()}
            loading={loading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Route Overview</h2>
              </div>
              <Badge variant="outline">{stops.length} Stops</Badge>
            </div>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading route...</div>
            ) : stops.length === 0 ? (
              <div className="text-sm text-muted-foreground">No locations added yet.</div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-xs uppercase text-muted-foreground">Start</p>
                    <p className="text-base font-semibold">{primaryStops.start?.name || "Not set"}</p>
                    {primaryStops.start?.imageData ? (
                      <img
                        src={primaryStops.start.imageData}
                        alt={primaryStops.start.name || "Start"}
                        className="h-32 w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                        None
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-xs uppercase text-muted-foreground">Destination</p>
                    <p className="text-base font-semibold">{primaryStops.destination?.name || "Not set"}</p>
                    {primaryStops.destination?.imageData ? (
                      <img
                        src={primaryStops.destination.imageData}
                        alt={primaryStops.destination.name || "Destination"}
                        className="h-32 w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                        None
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Stops</p>
                  {primaryStops.middles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No intermediate stops recorded.</p>
                  ) : (
                    <ol className="space-y-2">
                      {primaryStops.middles.map((stop: any, index: number) => (
                        <li key={stop._id || index} className="flex items-start gap-3 rounded-lg border p-3">
                          <span className="mt-1 h-6 w-6 rounded-full bg-primary/10 text-center text-sm font-semibold text-primary">
                            {index + 1}
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{stop.name}</p>
                            {stop.time && (
                              <p className="text-xs text-muted-foreground">{stop.time}</p>
                            )}
                            {stop.accommodation && (
                              <p className="text-xs text-muted-foreground">Stay: {stop.accommodation}</p>
                            )}
                          </div>
                          {stop.imageData ? (
                            <img
                              src={stop.imageData}
                              alt={stop.name || `Stop ${index + 1}`}
                              className="h-20 w-28 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-20 w-28 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                              None
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Budget Allocation</h2>
            </div>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading budget...</div>
            ) : budgetItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No budget items added.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Allocated</span>
                    <span>₹{totals.totalAllocated.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${totals.progressAllocated}%` }}
                    />
                  </div>
                </div>
                <ul className="space-y-3">
                  {budgetByCategory.map(([category, amount]) => (
                    <li key={category} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium">{category}</span>
                      <span className="font-semibold">₹{amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Recent Spending</h2>
            </div>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading spending...</div>
            ) : recentSpending.length === 0 ? (
              <div className="text-sm text-muted-foreground">No spending recorded yet.</div>
            ) : (
              <ul className="space-y-3">
                {recentSpending.map((entry: any) => (
                  <li key={entry._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.date).toLocaleDateString()}
                        {entry.userId?.username && (
                          <span className="inline-flex items-center gap-1">
                            by
                            <span className="font-medium">{entry.userId.username}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-semibold">₹{Number(entry.amount || 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-2">
              <Button variant="outline" className="w-full" onClick={() => navigate(`/trip/${id}/spending`)}>
                View all spending
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Members</h2>
            </div>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-muted-foreground">No members joined yet.</div>
            ) : (
              <ul className="space-y-3">
                {members.map((member: any) => (
                  <li key={member._id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {member.userId?.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.userId?.username || "Member"}</p>
                      <p className="text-xs text-muted-foreground">@{member.userId?.userId}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Badge variant="outline">{member.role || "member"}</Badge>
                      {(currentUserRole === "organizer" || currentUserRole === "co_organizer") && member.role !== "organizer" && (
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRoleMenu(member._id)}
                          >
                            Manage
                          </Button>
                          {roleMenu === member._id && (
                            <div className="absolute right-0 mt-2 w-40 rounded-md border bg-popover shadow-lg">
                              <button
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => handleRoleChange(member._id, "co_organizer")}
                              >
                                Make Co-Organizer
                              </button>
                              {currentUserRole === "organizer" && (
                                <button
                                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => handleRoleChange(member._id, "organizer")}
                                >
                                  Make Organizer
                                </button>
                              )}
                              <button
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => handleRoleChange(member._id, "member")}
                              >
                                Make Member
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subValue?: string;
  loading?: boolean;
  highlight?: string;
}

function MetricCard({ icon, title, value, subValue, loading, highlight }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="text-sm font-medium uppercase">{title}</p>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-28 animate-pulse rounded bg-muted" />
        ) : (
          <p className={`text-2xl font-semibold ${highlight || ""}`}>{value}</p>
        )}
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}
      </div>
    </Card>
  );
}
