import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { ArrowLeft, Users, IndianRupee, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TripMembers() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data: trip } = useQuery({
    queryKey: ['/api/trips', id],
    queryFn: () => apiRequest(`/api/trips/${id}`),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['/api/trips', id, 'members'],
    queryFn: () => apiRequest(`/api/trips/${id}/members`),
  });

  const { data: spendingEntries = [] } = useQuery({
    queryKey: ['/api/trips', id, 'spending'],
    queryFn: () => apiRequest(`/api/trips/${id}/spending`),
  });

  // Calculate member balances
  const memberBalances = members.map((member: any) => {
    const memberId = member.userId._id;

    // Calculate total spent by this member (entries they created)
    const totalSpent = spendingEntries
      .filter((entry: any) => entry.userId === memberId)
      .reduce((sum: number, entry: any) => sum + entry.amount, 0);

    // Calculate total owed TO this member (others' shares of spending they paid for)
    const totalOwedToThem = spendingEntries
      .filter((entry: any) => entry.userId === memberId)
      .reduce((sum: number, entry: any) => {
        // Sum up all participant shares except their own
        const otherShares = entry.participantShares?.filter(
          (share: any) => share.memberId !== memberId
        ) || [];
        return sum + otherShares.reduce((shareSum: number, share: any) => shareSum + share.amount, 0);
      }, 0);

    // Calculate total they owe TO others (their share of spending others paid for)
    const totalTheyOwe = spendingEntries
      .filter((entry: any) => entry.userId !== memberId)
      .reduce((sum: number, entry: any) => {
        const memberShare = entry.participantShares?.find(
          (share: any) => share.memberId === memberId
        );
        return sum + (memberShare?.amount || 0);
      }, 0);

    const netBalance = totalOwedToThem - totalTheyOwe;

    // Get spending breakdown for this member
    const memberSpending = spendingEntries
      .filter((entry: any) => entry.userId === memberId)
      .map((entry: any) => ({
        ...entry,
        participants: entry.participantShares?.map((share: any) => {
          const participant = members.find((m: any) => m.userId._id === share.memberId);
          return {
            ...share,
            username: participant?.userId?.username || 'Unknown'
          };
        }) || []
      }));

    return {
      ...member,
      totalSpent,
      totalOwedToThem,
      totalTheyOwe,
      netBalance,
      spending: memberSpending
    };
  });

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { status: 'positive', color: 'text-green-600', icon: TrendingUp, text: 'You are owed' };
    if (balance < 0) return { status: 'negative', color: 'text-red-600', icon: TrendingDown, text: 'You owe' };
    return { status: 'settled', color: 'text-gray-600', icon: Minus, text: 'Settled up' };
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/trip/${id}/dashboard`)}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="font-serif text-2xl font-bold" data-testid="text-trip-name">
                {trip?.name || "Trip"} - Members
              </h1>
              <p className="text-sm text-muted-foreground">Balance Summary & Details</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Member Balance Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberBalances.map((member: any) => {
              const balanceInfo = getBalanceStatus(member.netBalance);
              const BalanceIcon = balanceInfo.icon;

              return (
                <Card key={member._id} className="p-6" data-testid={`card-member-${member.userId._id}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {member.userId?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" data-testid="text-member-name">
                        {member.userId?.username}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Spent</span>
                      <span className="font-semibold text-green-600">
                        ₹{member.totalSpent.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Owed to You</span>
                      <span className="font-semibold text-green-600">
                        ₹{member.totalOwedToThem.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">You Owe</span>
                      <span className="font-semibold text-red-600">
                        ₹{member.totalTheyOwe.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Net Balance</span>
                        <div className={`flex items-center gap-1 font-bold ${balanceInfo.color}`}>
                          <BalanceIcon className="w-4 h-4" />
                          ₹{Math.abs(member.netBalance).toFixed(2)}
                          <span className="text-xs">({balanceInfo.text})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Detailed Spending Breakdown */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <IndianRupee className="w-6 h-6" />
              Spending Breakdown
            </h2>

            {memberBalances.map((member: any) => (
              <Card key={`details-${member._id}`} className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {member.userId?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{member.userId?.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      {member.spending.length} spending entries
                    </p>
                  </div>
                </div>

                {member.spending.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No spending entries from this member yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {member.spending.map((entry: any) => (
                      <div key={entry._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{entry.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString()} • {entry.splitType} split
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">₹{entry.amount.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Total spent</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-muted-foreground">Split among:</h5>
                          {entry.participants.map((participant: any) => (
                            <div key={participant.memberId} className="flex justify-between text-sm">
                              <span>{participant.username}</span>
                              <span className="font-medium">₹{participant.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}