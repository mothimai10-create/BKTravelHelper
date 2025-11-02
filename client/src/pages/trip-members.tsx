import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, IndianRupee, Edit2, Check, X, FileDown } from "lucide-react";
import { useState } from "react";

export default function TripMembers() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ creditAmount: 0, spentAmount: 0 });

  const { data: trip } = useQuery({
    queryKey: ['/api/trips', id],
    queryFn: () => apiRequest(`/api/trips/${id}`),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['/api/trips', id, 'members'],
    queryFn: () => apiRequest(`/api/trips/${id}/members`),
  });

  // Get current user's role
  const userMember = members.find((m: any) => m.userId?._id === user?.id);
  const isOrganizer = userMember?.role === 'organizer';

  const updateBalanceMutation = useMutation({
    mutationFn: ({ memberId, creditAmount, spentAmount }: any) =>
      apiRequest(`/api/trips/${id}/members/${memberId}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ creditAmount, spentAmount }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id, 'members'] });
      toast({ title: "Member balance updated successfully" });
      setEditingMemberId(null);
    },
    onError: () => {
      toast({ title: "Failed to update member balance", variant: "destructive" });
    },
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/trips/${id}/members/pdf`, {
        credentials: 'include'
      });
      if (!response.ok) {
        toast({ title: "Failed to download PDF", variant: "destructive" });
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `member-balance-${trip?.name || 'trip'}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded successfully" });
    } catch (error) {
      toast({ title: "Error downloading PDF", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-light-blue">
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
          <Button
            onClick={handleDownloadPDF}
            className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
          >
            <FileDown className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Member Balance Overview */}
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <Users className="w-6 h-6" />
              Member Balances
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member: any) => {
                const isEditingThis = editingMemberId === member._id;
                const balanceColor = member.balance > 0 ? 'text-green-600' : member.balance < 0 ? 'text-red-600' : 'text-gray-600';

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
                      {isOrganizer && !isEditingThis && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMemberId(member._id);
                            setEditValues({
                              creditAmount: member.creditAmount || 0,
                              spentAmount: member.spentAmount || 0,
                            });
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {isEditingThis ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">Credit Amount</label>
                          <input
                            type="number"
                            value={editValues.creditAmount}
                            onChange={(e) => setEditValues({ ...editValues, creditAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border rounded mt-1"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Spent Amount</label>
                          <input
                            type="number"
                            value={editValues.spentAmount}
                            onChange={(e) => setEditValues({ ...editValues, spentAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border rounded mt-1"
                            step="0.01"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              updateBalanceMutation.mutate({
                                memberId: member._id,
                                creditAmount: editValues.creditAmount,
                                spentAmount: editValues.spentAmount,
                              })
                            }
                            className="flex-1"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMemberId(null)}
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Credit Amount</span>
                          <span className="font-semibold text-blue-600">
                            ₹{(member.creditAmount || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Spent Amount</span>
                          <span className="font-semibold text-orange-600">
                            ₹{(member.spentAmount || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Balance</span>
                            <span className={`font-bold ${balanceColor}`}>
                              ₹{(member.balance || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}