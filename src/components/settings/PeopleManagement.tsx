import { useState } from 'react';
import { Users, UserPlus, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PeopleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('salespeople');
  
  // Form states
  const [newSalesperson, setNewSalesperson] = useState({ name: '', email: '', role: 'sales_rep' });
  const [newAdjuster, setNewAdjuster] = useState({ name: '', full_name: '', office: 'Houston' });

  // Fetch salespeople
  const { data: salespeople = [] } = useQuery({
    queryKey: ['salespeople-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salespeople')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch adjusters
  const { data: adjusters = [] } = useQuery({
    queryKey: ['adjusters-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adjusters')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Add salesperson mutation
  const addSalespersonMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; role: string }) => {
      const { error } = await supabase
        .from('salespeople')
        .insert([{ name: data.name, email: data.email || null, role: data.role }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople-management'] });
      queryClient.invalidateQueries({ queryKey: ['salespeople'] });
      toast({ title: 'Salesperson added', description: `${newSalesperson.name} has been added.` });
      setNewSalesperson({ name: '', email: '', role: 'sales_rep' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Remove salesperson mutation (soft delete)
  const removeSalespersonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('salespeople')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople-management'] });
      queryClient.invalidateQueries({ queryKey: ['salespeople'] });
      toast({ title: 'Salesperson removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Add adjuster mutation
  const addAdjusterMutation = useMutation({
    mutationFn: async (data: { name: string; full_name: string; office: string }) => {
      const { error } = await supabase
        .from('adjusters')
        .insert([{ name: data.name, full_name: data.full_name || null, office: data.office }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjusters-management'] });
      queryClient.invalidateQueries({ queryKey: ['adjusters'] });
      toast({ title: 'Adjuster added', description: `${newAdjuster.name} has been added.` });
      setNewAdjuster({ name: '', full_name: '', office: 'Houston' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Remove adjuster mutation (soft delete)
  const removeAdjusterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('adjusters')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjusters-management'] });
      queryClient.invalidateQueries({ queryKey: ['adjusters'] });
      toast({ title: 'Adjuster removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleAddSalesperson = () => {
    if (!newSalesperson.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    addSalespersonMutation.mutate(newSalesperson);
  };

  const handleAddAdjuster = () => {
    if (!newAdjuster.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    addAdjusterMutation.mutate(newAdjuster);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Users className="w-3.5 h-3.5" />
          <span>Manage People</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Manage People</DialogTitle>
          <DialogDescription>Add or remove salespeople and adjusters.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="salespeople" className="text-xs">Salespeople</TabsTrigger>
            <TabsTrigger value="adjusters" className="text-xs">Adjusters</TabsTrigger>
          </TabsList>

          <TabsContent value="salespeople" className="space-y-4 mt-4">
            {/* Add Salesperson Form */}
            <form 
              className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddSalesperson();
              }}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <UserPlus className="w-3.5 h-3.5" />
                Add New Salesperson
              </div>
              <div className="grid gap-2">
                <Input
                  placeholder="Name *"
                  value={newSalesperson.name}
                  onChange={(e) => setNewSalesperson(prev => ({ ...prev, name: e.target.value }))}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Email (optional)"
                  type="email"
                  value={newSalesperson.email}
                  onChange={(e) => setNewSalesperson(prev => ({ ...prev, email: e.target.value }))}
                  className="h-8 text-sm"
                />
                <Select
                  value={newSalesperson.role}
                  onValueChange={(val) => setNewSalesperson(prev => ({ ...prev, role: val }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_rep">Sales Rep</SelectItem>
                    <SelectItem value="sales_director">Sales Director</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" disabled={addSalespersonMutation.isPending}>
                  Add Salesperson
                </Button>
              </div>
            </form>

            {/* Current Salespeople List */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Current Salespeople ({salespeople.length})</Label>
              <ScrollArea className="h-[150px] rounded-lg border border-border/50">
                <div className="p-2 space-y-1">
                  {salespeople.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{person.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{person.role === 'sales_director' ? 'Director' : 'Rep'}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {person.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will deactivate the salesperson. Their historical data will be preserved.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeSalespersonMutation.mutate(person.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="adjusters" className="space-y-4 mt-4">
            {/* Add Adjuster Form */}
            <form 
              className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddAdjuster();
              }}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <UserPlus className="w-3.5 h-3.5" />
                Add New Adjuster
              </div>
              <div className="grid gap-2">
                <Input
                  placeholder="Short Name (e.g., Art J.) *"
                  value={newAdjuster.name}
                  onChange={(e) => setNewAdjuster(prev => ({ ...prev, name: e.target.value }))}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Full Name (optional)"
                  value={newAdjuster.full_name}
                  onChange={(e) => setNewAdjuster(prev => ({ ...prev, full_name: e.target.value }))}
                  className="h-8 text-sm"
                />
                <Select
                  value={newAdjuster.office}
                  onValueChange={(val) => setNewAdjuster(prev => ({ ...prev, office: val }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Houston">Houston</SelectItem>
                    <SelectItem value="Dallas">Dallas</SelectItem>
                    <SelectItem value="Louisiana">Louisiana</SelectItem>
                    <SelectItem value="Austin">Austin</SelectItem>
                    <SelectItem value="San Antonio">San Antonio</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" disabled={addAdjusterMutation.isPending}>
                  Add Adjuster
                </Button>
              </div>
            </form>

            {/* Current Adjusters List */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Current Adjusters ({adjusters.length})</Label>
              <ScrollArea className="h-[150px] rounded-lg border border-border/50">
                <div className="p-2 space-y-1">
                  {adjusters.map((adjuster) => (
                    <div key={adjuster.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 group">
                      <div className="min-w-0 flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium truncate">{adjuster.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{adjuster.office}</p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {adjuster.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will deactivate the adjuster. Their historical claim data will be preserved.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeAdjusterMutation.mutate(adjuster.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
