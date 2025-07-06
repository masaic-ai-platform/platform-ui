import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Code2, Star, ExternalLink, Database } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-toggle';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-background border-b border-border">
      {/* Navigation Header - Redesigned with Geist UI */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-positive-trend to-positive-trend rounded-xl flex items-center justify-center shadow-md">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Masaic Dev Platform
              </h1>

            </div>
          </div>
          
          {/* Navigation Tabs and Theme Toggle - Redesigned with Geist UI */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-muted p-2 rounded-xl border border-border shadow-sm">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-2 transition-all duration-200 px-4 py-2 rounded-lg ${
                    isActive('/') 
                      ? 'bg-background shadow-sm text-foreground border border-border' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Chat</span>
                </Button>
              </Link>
              <Link to="/playground">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-2 transition-all duration-200 px-4 py-2 rounded-lg ${
                    isActive('/playground') 
                      ? 'bg-background shadow-sm text-foreground border border-border' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background'
                  }`}
                >
                  <Code2 className="h-4 w-4" />
                  <span className="font-medium">Playground</span>
                </Button>
              </Link>
            </div>
            
            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>


    </div>
  );
};

export default Navigation; 