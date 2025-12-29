import { useTheme, ThemeVariant } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeOption {
  id: ThemeVariant;
  name: string;
  description: string;
  preview: {
    bg: string;
    primary: string;
    accent: string;
    secondary?: string;
  };
}

const themes: ThemeOption[] = [
  {
    id: 'cyan-glass',
    name: 'Cyan Glass',
    description: 'Frosted glass with cyan glow',
    preview: {
      bg: 'bg-[hsl(222,47%,6%)]',
      primary: 'bg-[hsl(172,66%,50%)]',
      accent: 'bg-[hsl(265,89%,70%)]',
    },
  },
  {
    id: 'neon-hex',
    name: 'Neon Hex',
    description: 'Multi-color hexagonal glow',
    preview: {
      bg: 'bg-[hsl(225,50%,5%)]',
      primary: 'bg-[hsl(220,90%,55%)]',
      accent: 'bg-[hsl(350,85%,55%)]',
      secondary: 'bg-[hsl(142,76%,45%)]',
    },
  },
  {
    id: 'amber-glow',
    name: 'Amber Glow',
    description: 'Warm amber & gold tones',
    preview: {
      bg: 'bg-[hsl(25,30%,8%)]',
      primary: 'bg-[hsl(32,95%,50%)]',
      accent: 'bg-[hsl(15,90%,55%)]',
    },
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Theme
      </p>
      <div className="space-y-2">
        {themes.map((themeOption) => (
          <button
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className={cn(
              "w-full p-3 rounded-xl border transition-all duration-200 text-left",
              theme === themeOption.id
                ? "border-primary/50 bg-primary/10"
                : "border-border/30 hover:border-border/50 hover:bg-muted/30"
            )}
          >
            <div className="flex items-center gap-3">
              {/* Theme Preview */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden",
                themeOption.preview.bg
              )}>
                <div className={cn(
                  "absolute w-3 h-3 rounded-full top-1 left-1",
                  themeOption.preview.primary
                )} />
                <div className={cn(
                  "absolute w-2 h-2 rounded-full bottom-1 right-1",
                  themeOption.preview.accent
                )} />
                {themeOption.preview.secondary && (
                  <div className={cn(
                    "absolute w-2 h-2 rounded-full top-1 right-2",
                    themeOption.preview.secondary
                  )} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {themeOption.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {themeOption.description}
                </p>
              </div>
              
              {theme === themeOption.id && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
