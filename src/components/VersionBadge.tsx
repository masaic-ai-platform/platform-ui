import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getVersionInfo, formatVersion } from '@/lib/version';

interface VersionBadgeProps {
  showTooltip?: boolean;
  className?: string;
}

const VersionBadge: React.FC<VersionBadgeProps> = ({ 
  showTooltip = true, 
  className = '' 
}) => {
  const versionInfo = getVersionInfo();
  const versionText = formatVersion(versionInfo.version);

  const versionDisplay = (
    <span 
      className={`text-xs text-muted-foreground font-mono ${className}`}
      aria-label={`Version ${versionInfo.version}`}
    >
      {versionText}
    </span>
  );

  if (!showTooltip) {
    return versionDisplay;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {versionDisplay}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">Version {versionInfo.version}</div>
            <div className="text-xs text-muted-foreground">
              <div>Environment: {versionInfo.environment}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VersionBadge; 