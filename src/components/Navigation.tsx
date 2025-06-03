import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Code2, Star, ExternalLink, Database } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-background1 dark:bg-accentGray-8 border-b border-accentGray-2 dark:border-accentGray-6">
      {/* GitHub Star Banner - Redesigned with Geist UI */}
      <div className="bg-gradient-to-r from-primary via-primary-light to-success dark:from-primary/90 dark:via-primary-light/90 dark:to-success/90 text-white px-6 py-3">
        <div className="flex items-center justify-center space-x-3 text-sm">
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
            <Star className="h-3 w-3 fill-current" />
          </div>
          <span className="font-medium">Like this project? Star us on GitHub!</span>
          <a 
            href="https://github.com/masaic-ai-platform/open-responses" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg transition-all duration-200 font-medium backdrop-blur-sm border border-white/20 hover:border-white/30"
          >
            <Star className="h-3 w-3 fill-current" />
            <span>Star</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Navigation Header - Redesigned with Geist UI */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-success rounded-xl flex items-center justify-center shadow-md">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-white tracking-tight">
                OpenResponses
              </h1>
              <p className="text-sm text-accentGray-5 dark:text-accentGray-4 mt-1">
                Showcase the capabilities of OpenResponses API
              </p>
            </div>
          </div>
          
          {/* Navigation Tabs - Redesigned with Geist UI */}
          <div className="flex items-center space-x-2 bg-background2 dark:bg-accentGray-7 p-2 rounded-xl border border-accentGray-2 dark:border-accentGray-6 shadow-sm">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center space-x-2 transition-all duration-200 px-4 py-2 rounded-lg ${
                  isActive('/') 
                    ? 'bg-background1 dark:bg-accentGray-6 shadow-sm text-foreground dark:text-white border border-accentGray-2 dark:border-accentGray-5' 
                    : 'text-accentGray-6 dark:text-accentGray-3 hover:text-foreground dark:hover:text-white hover:bg-background1 dark:hover:bg-accentGray-6'
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
                    ? 'bg-background1 dark:bg-accentGray-6 shadow-sm text-foreground dark:text-white border border-accentGray-2 dark:border-accentGray-5' 
                    : 'text-accentGray-6 dark:text-accentGray-3 hover:text-foreground dark:hover:text-white hover:bg-background1 dark:hover:bg-accentGray-6'
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span className="font-medium">Playground</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Indicator - New Geist UI element */}
      <div className="px-8 pb-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-accentGray-5 dark:text-accentGray-4">
            <span className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>API Ready</span>
            </span>
            <span>•</span>
            <span>Real-time responses</span>
            <span>•</span>
            <span>File search enabled</span>
          </div>
          <div className="text-accentGray-5 dark:text-accentGray-4">
            <span>Version 1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 