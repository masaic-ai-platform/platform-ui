import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { 
  Code, 
  Search, 
  FileSearch,
  Image,
  Brain
} from 'lucide-react';
import { MCP } from '@lobehub/icons';
import FunctionModal from './FunctionModal';
import MCPModal from './MCPModal';

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  functionDefinition?: string; // For function tools
  mcpConfig?: any; // For MCP server tools
}

interface ToolsSelectionModalProps {
  selectedTools: Tool[];
  onToolSelect: (tool: Tool) => void;
  editingFunction?: Tool | null;
  onEditingFunctionChange?: (editingFunction: Tool | null) => void;
  editingMCP?: Tool | null;
  onEditingMCPChange?: (editingMCP: Tool | null) => void;
  children?: React.ReactNode;
}

const availableTools: Tool[] = [
  {
    id: 'mcp_server',
    name: 'MCP Server',
    icon: MCP
  },
  {
    id: 'function',
    name: 'Function',
    icon: Code
  },
  {
    id: 'file_search',
    name: 'File Search',
    icon: Search
  },
  {
    id: 'agentic_file_search',
    name: 'Agentic File Search',
    icon: FileSearch
  },
  {
    id: 'image_generation',
    name: 'Image Generation',
    icon: Image
  },
  {
    id: 'think',
    name: 'Think',
    icon: Brain
  }
];

const ToolsSelectionModal: React.FC<ToolsSelectionModalProps> = ({
  selectedTools,
  onToolSelect,
  editingFunction,
  onEditingFunctionChange,
  editingMCP,
  onEditingMCPChange,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [functionModalOpen, setFunctionModalOpen] = useState(false);
  const [functionDefinition, setFunctionDefinition] = useState('');
  const [mcpModalOpen, setMcpModalOpen] = useState(false);

  // Handle editing existing function
  React.useEffect(() => {
    if (editingFunction && editingFunction.id === 'function') {
      setFunctionDefinition(editingFunction.functionDefinition || '');
      setFunctionModalOpen(true);
    }
  }, [editingFunction]);

  // Handle editing existing MCP server
  React.useEffect(() => {
    if (editingMCP && editingMCP.id === 'mcp_server') {
      setMcpModalOpen(true);
    }
  }, [editingMCP]);

  const handleToolSelect = (tool: Tool) => {
    if (tool.id === 'function') {
      setIsOpen(false);
      setFunctionModalOpen(true);
    } else if (tool.id === 'mcp_server') {
      setIsOpen(false);
      setMcpModalOpen(true);
    } else {
      onToolSelect(tool);
      setIsOpen(false);
    }
  };

  const handleFunctionSave = () => {
    // Get function name from definition for better display
    let functionName = 'Function';
    try {
      const parsed = JSON.parse(functionDefinition);
      functionName = parsed.name || 'Function';
    } catch {
      // Keep default name if parsing fails
    }

    // Create function tool with definition
    const functionTool: Tool = {
      id: 'function',
      name: functionName,
      icon: Code,
      functionDefinition: functionDefinition
    };

    // If editing, remove the old function first
    if (editingFunction && onEditingFunctionChange) {
      // The parent component will handle removing the old function and adding the new one
      onEditingFunctionChange(null);
    }

    onToolSelect(functionTool);
    setFunctionModalOpen(false);
    setFunctionDefinition('');
    
    // Clear editing state
    if (onEditingFunctionChange) {
      onEditingFunctionChange(null);
    }
  };

  const handleMCPConnect = (config: any) => {
    // Create MCP server tool with config
    const mcpTool: Tool = {
      id: 'mcp_server',
      name: config.label || 'MCP Server',
      icon: MCP,
      mcpConfig: config // Store the full config including selectedTools
    };

    // If editing, remove the old MCP server first
    if (editingMCP && onEditingMCPChange) {
      // The parent component will handle removing the old MCP server and adding the new one
      onEditingMCPChange(null);
    }

    onToolSelect(mcpTool);
    setMcpModalOpen(false);
    
    // Clear editing state
    if (onEditingMCPChange) {
      onEditingMCPChange(null);
    }
  };

  const isToolSelected = (toolId: string) => {
    // Allow multiple functions and MCP servers to be added
    if (toolId === 'function' || toolId === 'mcp_server') {
      return false;
    }
    return selectedTools.some(tool => tool.id === toolId);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {children || (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:bg-muted/50"
            >
              +
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent 
          className="w-56 p-2 border border-border/50 shadow-lg"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          side="right"
          align="start"
        >
          <div className="space-y-1">
            {availableTools.map((tool) => {
              const IconComponent = tool.icon;
              const isSelected = isToolSelected(tool.id);
              
              return (
                <Button
                  key={tool.id}
                  variant="ghost"
                  className={`w-full justify-start h-auto p-3 hover:bg-positive-trend/10 hover:text-positive-trend focus:bg-positive-trend/10 focus:text-positive-trend rounded-md ${
                    isSelected ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !isSelected && handleToolSelect(tool)}
                  disabled={isSelected}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <IconComponent className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{tool.name}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      
              <FunctionModal
      open={functionModalOpen}
      onOpenChange={(open) => {
        setFunctionModalOpen(open);
        if (!open) {
          // Clear editing state when modal closes
          if (onEditingFunctionChange) {
            onEditingFunctionChange(null);
          }
          setFunctionDefinition('');
        }
      }}
      functionDefinition={functionDefinition}
      onFunctionDefinitionChange={setFunctionDefinition}
      onSave={handleFunctionSave}
    />
    
    <MCPModal
      open={mcpModalOpen}
      onOpenChange={(open) => {
        setMcpModalOpen(open);
        if (!open) {
          // Clear editing state when modal closes
          if (onEditingMCPChange) {
            onEditingMCPChange(null);
          }
        }
      }}
      onConnect={handleMCPConnect}
      initialConfig={editingMCP?.mcpConfig}
    />
  </>
  );
};

export default ToolsSelectionModal; 