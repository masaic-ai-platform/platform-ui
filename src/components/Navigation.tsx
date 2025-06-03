import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Code2, Star, ExternalLink } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-white border-b">
      {/* GitHub Star Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2">
        <div className="flex items-center justify-center space-x-2 text-sm">
          <Star className="h-4 w-4 fill-current" />
          <span>Like this project? Star us on GitHub!</span>
          <a 
            href="https://github.com/masaic-ai-platform/open-responses" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors duration-200"
          >
            <span className="font-medium">⭐ Star</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Navigation Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OpenResponses</h1>
            <p className="text-sm text-gray-500">
              Showcase the capabilities of OpenResponses API
            </p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/') 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-800 hover:text-white hover:bg-gray-800'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Chat</span>
              </Button>
            </Link>
            <Link to="/playground">
              <Button
                variant={isActive('/playground') ? 'default' : 'ghost'}
                size="sm"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/playground') 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-800 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span className="font-medium">Playground</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 