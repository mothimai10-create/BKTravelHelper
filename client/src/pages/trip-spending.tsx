import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, IndianRupee, Download, Calendar } from "lucide-react";
import jsPDF from "jspdf";

export default function TripSpending() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: trip } = useQuery({
    queryKey: ['/api/trips', id],
    queryFn: () => apiRequest(`/api/trips/${id}`),
  });

  const { data: spendingEntries = [] } = useQuery({
    queryKey: ['/api/trips', id, 'spending'],
    queryFn: () => apiRequest(`/api/trips/${id}/spending`),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['/api/trips', id, 'members'],
    queryFn: () => apiRequest(`/api/trips/${id}/members`),
  });

  const addSpendingMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/trips/${id}/spending`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id, 'spending'] });
      setDescription("");
      setAmount("");
      setDate(new Date().toISOString().split('T')[0]);
      toast({ title: "Spending entry added successfully" });
    },
  });

  const handleAddSpending = (e: React.FormEvent) => {
    e.preventDefault();
    addSpendingMutation.mutate({
      description,
      amount: parseFloat(amount),
      date: new Date(date),
    });
  };

  const totalSpent = spendingEntries.reduce((sum: number, entry: any) => sum + parseFloat(entry.amount), 0);
  const remaining = parseFloat(trip?.totalBudget || "0") - totalSpent;
  const perPerson = totalSpent / (trip?.numberOfMembers || 1);

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`${trip?.name} - Spending Summary`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Budget: ₹${parseFloat(trip?.totalBudget || "0").toFixed(2)}`, 20, 40);
    doc.text(`Total Spent: ₹${totalSpent.toFixed(2)}`, 20, 50);
    doc.text(`Remaining: ₹${remaining.toFixed(2)}`, 20, 60);
    doc.text(`Per Person: ₹${perPerson.toFixed(2)}`, 20, 70);
    
    doc.text('Expenses:', 20, 85);
    
    let y = 95;
    spendingEntries.forEach((entry: any, index: number) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const dateStr = new Date(entry.date).toLocaleDateString();
      const text = `${index + 1}. ${entry.description} - ₹${parseFloat(entry.amount).toFixed(2)} (${dateStr})`;
      doc.text(text, 25, y);
      y += 10;
    });
    
    doc.save(`${trip?.name}-spending-summary.pdf`);
    toast({ title: "PDF downloaded successfully!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/home')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="font-serif text-2xl font-bold" data-testid="text-trip-name">
                {trip?.name || 'Trip'} - Spending
              </h1>
            </div>
          </div>
          <Button onClick={exportPDF} variant="outline" data-testid="button-export-pdf">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Add Spending Entry</h2>
              <form onSubmit={handleAddSpending} className="space-y-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Lunch at restaurant"
                    required
                    data-testid="input-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      data-testid="input-amount"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      data-testid="input-date"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" data-testid="button-add-spending">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Spending Entry
                </Button>
              </form>
            </Card>

            <div>
              <h2 className="text-xl font-semibold mb-4">Spending History</h2>
              {spendingEntries.length === 0 ? (
                <Card className="p-8 text-center">
                  <IndianRupee className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No spending entries yet</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {spendingEntries.map((entry: any) => (
                    <Card key={entry._id} className="p-4" data-testid={`card-spending-${entry._id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1" data-testid="text-spending-description">
                            {entry.description}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            <span>By: {entry.userId?.username || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold" data-testid="text-spending-amount">
                            ₹{parseFloat(entry.amount).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ₹{(parseFloat(entry.amount) / (trip?.numberOfMembers || 1)).toFixed(2)}/person
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Budget Overview</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold" data-testid="text-total-budget">
                      ₹{parseFloat(trip?.totalBudget || "0").toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span className="font-semibold" data-testid="text-total-spent">
                      ₹{totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`rounded-full h-2 transition-all ${
                        remaining < 0 ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min((totalSpent / parseFloat(trip?.totalBudget || "1")) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold">Remaining</span>
                    <span 
                      className={`text-lg font-bold ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}
                      data-testid="text-remaining"
                    >
                      ₹{remaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Per Person Split</h2>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-per-person">
                  ₹{perPerson.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  per person ({trip?.numberOfMembers} members)
                </p>
              </div>
            </Card>

            {remaining < 0 && (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Budget exceeded by ₹{Math.abs(remaining).toFixed(2)}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
