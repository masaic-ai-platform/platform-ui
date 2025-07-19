import React from 'react';
import VersionBadge from './VersionBadge';

const Navigation: React.FC = () => {

  return (
    <div className="bg-background border-b border-border">
      {/* Navigation Header - Redesigned with Geist UI */}
      <div className="px-8 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src="/Masaic-Logo.png" 
                alt="Masaic Logo" 
                className="h-21 w-21 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-foreground tracking-tight">
                Masaic Dev Platform
              </h1>

            </div>
          </div>
          
          {/* Version Badge in top-right corner */}
          <div className="flex items-center">
            <VersionBadge />
          </div>
        </div>
      </div>


    </div>
  );
};

export default Navigation; 