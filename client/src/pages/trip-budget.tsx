import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import jsPDF from "jspdf";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, IndianRupee } from "lucide-react";

const BUDGET_CATEGORIES = [
  "Accommodation",
  "Transportation",
  "Food & Dining",
  "Activities",
  "Shopping",
  "Emergency Fund",
  "Other",
];

export default function TripBudget() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const { data: trip } = useQuery({
    queryKey: ['/api/trips', id],
    queryFn: () => apiRequest(`/api/trips/${id}`),
  });

  const { data: budgetData } = useQuery({
    queryKey: ['/api/trips', id, 'budget'],
    queryFn: () => apiRequest(`/api/trips/${id}/budget`),
  });

  const budgetItems = budgetData?.items ?? [];
  const budgetHistory = budgetData?.history ?? [];
  const totalBudgetAmount = Number(budgetData?.totalBudget ?? trip?.totalBudget ?? 0);

  const addBudgetMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/trips/${id}/budget`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id, 'budget'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id] });
      setCategory("");
      setDescription("");
      setAmount("");
      toast({ title: "Budget item added successfully" });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest(`/api/trips/${id}/budget/${itemId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id, 'budget'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id] });
      toast({ title: "Budget item deleted successfully" });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    addBudgetMutation.mutate({
      category,
      description,
      amount: parseFloat(amount),
    });
  };

  const totalAllocated = budgetItems.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const remaining = totalBudgetAmount - totalAllocated;

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${trip?.name || 'Trip'} Budget Report`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Total Budget: ₹${totalBudgetAmount.toFixed(2)}`, 14, 32);
    doc.text(`Allocated: ₹${totalAllocated.toFixed(2)}`, 14, 40);
    doc.text(`Remaining: ₹${remaining.toFixed(2)}`, 14, 48);

    doc.text(`Budget Items`, 14, 60);
    let y = 68;
    budgetItems.forEach((item: any, index: number) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${item.category} - ${item.description} - ₹${Number(item.amount || 0).toFixed(2)}`, 14, y);
      y += 8;
    });

    if (budgetHistory.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text(`History`, 14, y);
      y += 10;
      doc.setFontSize(12);
      budgetHistory.forEach((entry: any, index: number) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const action = entry.type === 'add' ? 'Added' : 'Removed';
        const entryDate = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '';
        doc.text(`${index + 1}. ${action} ₹${Number(entry.amount || 0).toFixed(2)} (${entry.category || ''}) on ${entryDate}. Total: ₹${Number(entry.totalAfter || 0).toFixed(2)}`, 14, y);
        y += 8;
      });
    }

    doc.save(`${trip?.name || 'trip'}-budget.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/trip/${id}/location`)}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="font-serif text-2xl font-bold" data-testid="text-trip-name">
                {trip?.name || 'Trip'} - Budget
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadPdf} data-testid="button-download-pdf">
              Download PDF
            </Button>
            <Button onClick={() => navigate('/home')} data-testid="button-finish">
              Finish & Go Home
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Add Budget Item</h2>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Total Budget</span>
                      <span className="font-semibold">₹{totalBudgetAmount.toFixed(2)}</span>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Allocated</span>
                      <span className="font-semibold">₹{totalAllocated.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className={`font-semibold ${remaining < 0 ? 'text-destructive' : ''}`}>₹{remaining.toFixed(2)}</span>
                    </div>
                  </Card>
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Hotel booking for 3 nights"
                    required
                    data-testid="input-description"
                  />
                </div>

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

                <Button type="submit" className="w-full" data-testid="button-add-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Budget Item
                </Button>
              </form>
            </Card>

            <div>
              <h2 className="text-xl font-semibold mb-4">Budget Items</h2>
              {budgetItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <IndianRupee className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No budget items added yet</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {budgetItems.map((item: any) => (
                    <Card key={item._id} className="p-4" data-testid={`card-budget-${item._id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                              {item.category}
                            </span>
                            <h3 className="font-semibold" data-testid="text-budget-description">{item.description}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold" data-testid="text-budget-amount">
                            ₹{parseFloat(item.amount).toFixed(2)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteBudgetMutation.mutate(item._id)}
                            data-testid="button-delete-item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-6">Budget Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold" data-testid="text-total-budget">
                      ₹{totalBudgetAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Allocated</span>
                    <span className="font-semibold" data-testid="text-allocated">
                      ₹{totalAllocated.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${totalBudgetAmount > 0 ? Math.min((totalAllocated / totalBudgetAmount) * 100, 100) : 0}%` }}
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

                {remaining < 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    ⚠️ Budget exceeded!
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
