import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Plus, X } from "lucide-react";

interface MemberManagerProps {
  tripId: string;
  isOrganizer: boolean;
}

export function MemberManager({ tripId, isOrganizer }: MemberManagerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();

  const { data: members = [] } = useQuery({
    queryKey: ['/api/trips', tripId, 'members'],
    queryFn: () => apiRequest(`/api/trips/${tripId}/members`),
  });

  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: () => apiRequest(`/api/users/search?q=${searchQuery}`),
    enabled: searchQuery.length > 0,
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/trips/${tripId}/members/add`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId, 'members'] });
      setSelectedUser(null);
      setSearchQuery("");
      toast({ title: "Member added successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add member", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        data-testid="button-manage-members"
      >
        <Users className="w-4 h-4 mr-2" />
        Members ({members.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="dialog-manage-members">
          <DialogHeader>
            <DialogTitle>Trip Members</DialogTitle>
            <DialogDescription>
              Manage and invite members to this trip
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Members */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Current Members</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                ) : (
                  members.map((member: any) => (
                    <Card key={member._id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" data-testid="text-member-name">
                          {member.userId?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{member.userId?.userId}
                        </p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Add Member Section */}
            {isOrganizer && (
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">Invite Member</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by User ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-member"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!searchQuery}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>

                  {searchQuery && (
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {isFetching ? (
                        <p className="text-sm text-muted-foreground">Searching...</p>
                      ) : searchResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No users found</p>
                      ) : (
                        searchResults.map((user: any) => {
                          const isAlreadyMember = members.some(
                            (m: any) => m.userId?._id === user._id
                          );
                          return (
                            <Card
                              key={user._id}
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-accent"
                              onClick={() => !isAlreadyMember && setSelectedUser(user)}
                              data-testid={`card-search-result-${user._id}`}
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {user.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{user.userId}
                                </p>
                              </div>
                              {isAlreadyMember ? (
                                <Badge variant="secondary">Already Member</Badge>
                              ) : (
                                <Badge variant="outline">Add</Badge>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {selectedUser && (
                  <Card className="p-4 mt-3 bg-accent">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{selectedUser.username}</p>
                        <p className="text-sm text-muted-foreground">
                          @{selectedUser.userId}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedUser(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => addMemberMutation.mutate(selectedUser.userId)}
                      disabled={addMemberMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-add-member"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Trip
                    </Button>
                  </Card>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}