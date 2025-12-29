import { useTheme, DensityVariant } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2 } from 'lucide-react';

interface DensityOption {
  id: DensityVariant;
  name: string;
  description: string;
  icon: typeof Maximize2;
}

const densityOptions: DensityOption[] = [
  {
    id: 'comfortable',
    name: 'Comfortable',
    description: 'More spacing, easier to read',
    icon: Maximize2,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Denser layout, more content',
    icon: Minimize2,
  },
];

export function DensitySwitcher() {
  const { density, setDensity } = useTheme();

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Density
      </p>
      <div className="flex gap-2">
        {densityOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setDensity(option.id)}
            className={cn(
              "flex-1 p-2 rounded-lg border transition-all duration-200 text-center",
              density === option.id
                ? "border-primary/50 bg-primary/10"
                : "border-border/30 hover:border-border/50 hover:bg-muted/30"
            )}
            title={option.description}
          >
            <div className="flex flex-col items-center gap-1">
              <option.icon className="w-4 h-4 text-foreground" />
              <span className="text-xs font-medium text-foreground">
                {option.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
