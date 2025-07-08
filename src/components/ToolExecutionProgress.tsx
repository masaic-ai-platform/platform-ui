import React from 'react';
import { Loader2 } from 'lucide-react';
import { MCP } from '@lobehub/icons';

interface ToolExecution {
  serverName: string;
  toolName: string;
  status: 'in_progress' | 'completed';
}

interface ToolExecutionProgressProps {
  toolExecutions: ToolExecution[];
}

const ToolExecutionProgress: React.FC<ToolExecutionProgressProps> = ({ toolExecutions }) => {
  // Group tools by server name
  const groupedByServer = toolExecutions.reduce((acc, tool) => {
    if (!acc[tool.serverName]) {
      acc[tool.serverName] = [];
    }
    acc[tool.serverName].push(tool);
    return acc;
  }, {} as Record<string, ToolExecution[]>);

  const serverNames = Object.keys(groupedByServer);

  if (serverNames.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-3">
      {serverNames.map((serverName, serverIndex) => (
        <div key={serverName} className="relative">
          {/* Vertical connecting line for overall progress (except for last server) */}
          {serverIndex < serverNames.length - 1 && (
            <div className="absolute left-3 top-8 w-0.5 h-full bg-border"></div>
          )}
          
          {/* Server header */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-positive-trend/10 border border-positive-trend/20">
              <MCP className="w-3 h-3 text-positive-trend" />
            </div>
            <span className="text-sm font-medium text-positive-trend">{serverName}</span>
          </div>
          
          {/* Tools under this server */}
          <div className="ml-8 space-y-2">
            {groupedByServer[serverName].map((tool, toolIndex) => (
              <div key={`${tool.serverName}_${tool.toolName}`} className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-4 h-4">
                  {tool.status === 'in_progress' ? (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-positive-trend/30"></div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{tool.toolName}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToolExecutionProgress; 