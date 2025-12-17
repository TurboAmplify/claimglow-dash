import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Salesperson } from "@/types/sales";
import { User, Users, BarChart3, Crown } from "lucide-react";

export type GoalView = 'personal' | 'team-members' | 'team-aggregate' | 'director';

interface GoalViewSelectorProps {
  currentView: GoalView;
  onViewChange: (view: GoalView) => void;
  currentPerson: Salesperson | null;
  teamMembers: Salesperson[];
  isDirector: boolean;
  selectedMemberId?: string;
  onMemberSelect?: (memberId: string) => void;
}

export function GoalViewSelector({
  currentView,
  onViewChange,
  currentPerson,
  teamMembers,
  isDirector,
  selectedMemberId,
  onMemberSelect,
}: GoalViewSelectorProps) {
  const viewOptions = [
    { value: 'personal', label: 'My Goals', icon: User, available: true },
    { value: 'team-members', label: 'Team Members', icon: Users, available: isDirector && teamMembers.length > 0 },
    { value: 'team-aggregate', label: 'Team Aggregate', icon: BarChart3, available: isDirector && teamMembers.length > 0 },
    { value: 'director', label: 'Director Dashboard', icon: Crown, available: isDirector },
  ];

  const availableViews = viewOptions.filter(v => v.available);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">View:</span>
        <Select value={currentView} onValueChange={(value) => onViewChange(value as GoalView)}>
          <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            {availableViews.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentView === 'team-members' && teamMembers.length > 0 && onMemberSelect && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Member:</span>
          <Select value={selectedMemberId} onValueChange={onMemberSelect}>
            <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {currentPerson && (
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Logged in as:</span>
          <span className="font-medium text-foreground">{currentPerson.name}</span>
          {isDirector && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
              Director
            </span>
          )}
        </div>
      )}
    </div>
  );
}
