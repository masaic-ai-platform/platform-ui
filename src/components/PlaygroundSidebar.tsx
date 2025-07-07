import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Zap, 
  Key,
  Github,
  MessageCircle
} from 'lucide-react';

interface PlaygroundSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const PlaygroundSidebar: React.FC<PlaygroundSidebarProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const mainOptions = [
    { id: 'responses', label: 'Responses', icon: MessageSquare },
    { id: 'completions', label: 'Completions', icon: Zap, disabled: true },
  ];

  const bottomOptions = [
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'github', label: 'GitHub', icon: Github, link: 'https://github.com/masaic-ai-platform' },
    { id: 'discord', label: 'Discord', icon: MessageCircle, link: 'https://discord.com/channels/1335132819260702723/1354795442004820068' },
  ];

  return (
    <div className="w-[10%] min-w-[160px] bg-background border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          PLAYGROUND
        </h2>
      </div>

      {/* Main Options */}
      <div className="flex-1 p-2 space-y-1">
        {mainOptions.map((option) => {
          const Icon = option.icon;
          const isDisabled = option.disabled;
          return (
            <Button
              key={option.id}
              variant={activeTab === option.id ? "secondary" : "ghost"}
              className={`w-full justify-start text-sm h-10 ${
                activeTab === option.id 
                  ? 'bg-accent text-accent-foreground' 
                  : isDisabled
                    ? 'text-muted-foreground cursor-not-allowed opacity-60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              onClick={() => !isDisabled && onTabChange(option.id)}
              disabled={isDisabled}
            >
              <Icon className="h-4 w-4 mr-3" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Bottom Options */}
      <div className="p-2 border-t border-border space-y-1">
        {bottomOptions.map((option) => {
          const Icon = option.icon;
          const hasLink = 'link' in option && option.link;
          
          if (hasLink) {
            return (
              <Button
                key={option.id}
                variant="ghost"
                className="w-full justify-start text-sm h-10 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={() => window.open(option.link, '_blank')}
              >
                <Icon className="h-4 w-4 mr-3" />
                {option.label}
              </Button>
            );
          }
          
          return (
            <Button
              key={option.id}
              variant="ghost"
              className="w-full justify-start text-sm h-10 text-muted-foreground hover:text-foreground hover:bg-accent/50"
              onClick={() => onTabChange(option.id)}
            >
              <Icon className="h-4 w-4 mr-3" />
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default PlaygroundSidebar; 