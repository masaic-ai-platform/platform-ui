import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Settings, 
  Trash2, 
  FileText,
  Zap,
  Database,
  Image,
  Search,
  Plus,
  X,
  Code,
  FileSearch,
  Brain,
  Globe,
  Terminal
} from 'lucide-react';
import { MCP } from '@lobehub/icons';
import ToolConfigModal from './ToolConfigModal';
import ToolsSelectionModal from './ToolsSelectionModal';
import PromptMessagesInline from './PromptMessagesInline';
import ApiKeysModal from './ApiKeysModal';
import ModelSelectionModal from './ModelSelectionModal';
import ConfigurationSettingsModal from './ConfigurationSettingsModal';

interface Model {
  name: string;
  modelSyntax: string;
}

interface Provider {
  name: string;
  description: string;
  supportedModels: Model[];
}

interface PromptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  functionDefinition?: string; // For function tools
  mcpConfig?: any; // For MCP server tools
  fileSearchConfig?: { selectedFiles: string[]; selectedVectorStore: string; vectorStoreName?: string }; // For file search tools
  agenticFileSearchConfig?: { selectedFiles: string[]; selectedVectorStore: string; vectorStoreName?: string; iterations: number }; // For agentic file search tools
}

interface ConfigurationPanelProps {
  // Model settings
  modelProvider: string;
  setModelProvider: (provider: string) => void;
  modelName: string;
  setModelName: (name: string) => void;
  
  // Image settings
  imageModelProvider: string;
  setImageModelProvider: (provider: string) => void;
  imageModelName: string;
  setImageModelName: (name: string) => void;
  imageProviderKey: string;
  setImageProviderKey: (key: string) => void;
  
  // API settings
  apiKey: string;
  setApiKey: (key: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  
  // Generation settings
  temperature: number;
  setTemperature: (temp: number) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
  topP: number;
  setTopP: (topP: number) => void;
  storeLogs: boolean;
  setStoreLogs: (store: boolean) => void;
  textFormat: 'text' | 'json_object' | 'json_schema';
  setTextFormat: (format: 'text' | 'json_object' | 'json_schema') => void;
  toolChoice: 'auto' | 'none';
  setToolChoice: (choice: 'auto' | 'none') => void;
  
  // System message
  instructions: string;
  setInstructions: (instructions: string) => void;
  
  // Prompt messages
  promptMessages?: PromptMessage[];
  onAddPromptMessage?: (message: PromptMessage) => void;
  onRemovePromptMessage?: (id: string) => void;
  
  // Tools
  selectedTools?: Tool[];
  onSelectedToolsChange?: (tools: Tool[]) => void;
  getMCPToolByLabel?: (label: string) => any;
  
  // Vector store
  selectedVectorStore: string;
  onVectorStoreSelect: (vectorStoreId: string | null) => void;
  
  // Actions
  onResetConversation: () => void;
  
  // API Keys modal trigger
  openApiKeysModal?: boolean;
  onApiKeysModalChange?: (open: boolean) => void;
  jsonSchemaContent: string;
  setJsonSchemaContent: (content: string) => void;
  jsonSchemaName: string | null;
  setJsonSchemaName: (name: string | null) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  modelProvider,
  setModelProvider,
  modelName,
  setModelName,
  imageModelProvider,
  setImageModelProvider,
  imageModelName,
  setImageModelName,
  imageProviderKey,
  setImageProviderKey,
  apiKey,
  setApiKey,
  baseUrl,
  setBaseUrl,
  temperature = 1.0,
  setTemperature,
  maxTokens = 2048,
  setMaxTokens,
  topP = 1.0,
  setTopP,
  storeLogs = true,
  setStoreLogs,
  textFormat = 'text',
  setTextFormat,
  toolChoice = 'auto',
  setToolChoice,
  instructions,
  setInstructions,
  promptMessages = [],
  onAddPromptMessage = () => {},
  onRemovePromptMessage = () => {},
  selectedTools = [],
  onSelectedToolsChange = () => {},
  getMCPToolByLabel = () => null,
  selectedVectorStore,
  onVectorStoreSelect,
  onResetConversation,
  openApiKeysModal = false,
  onApiKeysModalChange = () => {},
  jsonSchemaContent,
  setJsonSchemaContent,
  jsonSchemaName,
  setJsonSchemaName
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingFunction, setEditingFunction] = useState<Tool | null>(null);
  const [editingMCP, setEditingMCP] = useState<Tool | null>(null);
  const [editingFileSearch, setEditingFileSearch] = useState<Tool | null>(null);
  const [editingAgenticFileSearch, setEditingAgenticFileSearch] = useState<Tool | null>(null);
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  const [requiredProvider, setRequiredProvider] = useState<string | undefined>(undefined);
  const [pendingModelSelection, setPendingModelSelection] = useState<string | null>(null);

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiUrl = import.meta.env.VITE_DASHBOARD_API_URL || 'http://localhost:6644';
        const response = await fetch(`${apiUrl}/v1/dashboard/models`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProviders(data);
      } catch (err) {
        console.error('Error fetching models:', err);
        setError('Failed to load models. Using fallback models.');
        
        // Fallback models
        setProviders([
          {
            name: 'openai',
            description: 'OpenAI models',
            supportedModels: [
              { name: 'gpt-4o', modelSyntax: 'openai@gpt-4o' },
              { name: 'gpt-4o-mini', modelSyntax: 'openai@gpt-4o-mini' },
              { name: 'gpt-3.5-turbo', modelSyntax: 'openai@gpt-3.5-turbo' },
            ]
          },
          {
            name: 'anthropic',
            description: 'Anthropic models',
            supportedModels: [
              { name: 'claude-3-opus', modelSyntax: 'anthropic@claude-3-opus' },
              { name: 'claude-3-sonnet', modelSyntax: 'anthropic@claude-3-sonnet' },
              { name: 'claude-3-haiku', modelSyntax: 'anthropic@claude-3-haiku' },
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Get all available models from providers - memoized to prevent unnecessary recalculations
  const allModels = useMemo(() => {
    return providers.flatMap(provider => 
      provider.supportedModels.map(model => ({
        ...model,
        providerName: provider.name,
        providerDescription: provider.description
      }))
    );
  }, [providers]);

  const getModelString = () => `${modelProvider}@${modelName}`;

  // Check if API key exists for provider
  const checkApiKey = (provider: string): boolean => {
    try {
      const saved = localStorage.getItem('platform_apiKeysys');
      if (!saved) return false;
      
      const savedKeys: { name: string; apiKey: string }[] = JSON.parse(saved);
      return savedKeys.some(item => item.name === provider && item.apiKey.trim());
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  };

  const handleModelSelect = (modelSyntax: string) => {
    const [provider, name] = modelSyntax.split('@');
    
    // Check if API key exists for this provider
    if (!checkApiKey(provider)) {
      setPendingModelSelection(modelSyntax);
      setRequiredProvider(provider);
      setApiKeysModalOpen(true);
      return; // Don't set the model until API key is provided
    }
    
    // API key exists, proceed with model selection
    setModelProvider(provider);
    setModelName(name);
    setPendingModelSelection(null);
  };

  const imageModels = [
    { provider: 'openai', name: 'dall-e-3', description: 'Advanced image generation' },
    { provider: 'openai', name: 'dall-e-2', description: 'Reliable image generation' },
    { provider: 'google', name: 'imagen-3.0-generate-002', description: 'Google\'s Imagen model' },
    { provider: 'gemini', name: 'imagen-3.0-generate-002', description: 'Gemini Imagen model' },
  ];

  const handleImageModelSelect = (modelString: string) => {
    const [provider, name] = modelString.split('@');
    setImageModelProvider(provider);
    setImageModelName(name);
  };

  // Tool management handlers
  const handleToolSelect = (tool: Tool) => {
    if (tool.id === 'function') {
      // If editing an existing function, remove the old one first
      if (editingFunction) {
        const updatedTools = selectedTools.filter(t => 
          !(t.id === 'function' && t.functionDefinition === editingFunction.functionDefinition)
        );
        onSelectedToolsChange([...updatedTools, tool]);
      } else {
        // Add the new function
        onSelectedToolsChange([...selectedTools, tool]);
      }
    } else if (tool.id === 'mcp_server') {
      // Allow multiple MCP servers
      onSelectedToolsChange([...selectedTools, tool]);
    } else {
      // For other tools, check by id only
      if (!selectedTools.find(t => t.id === tool.id)) {
        onSelectedToolsChange([...selectedTools, tool]);
      }
    }
  };

  const handleToolRemove = (toolId: string, functionDefinition?: string, toolIndex?: number) => {
    if (toolId === 'function' && functionDefinition) {
      // Remove specific function by definition
      const updatedTools = selectedTools.filter(tool => 
        !(tool.id === 'function' && tool.functionDefinition === functionDefinition)
      );
      onSelectedToolsChange(updatedTools);
    } else if (toolId === 'mcp_server' && toolIndex !== undefined) {
      // For MCP servers, remove by index since we allow multiple
      const updatedTools = selectedTools.filter((_, index) => index !== toolIndex);
      onSelectedToolsChange(updatedTools);
    } else {
      // Remove by id for other tools
      const updatedTools = selectedTools.filter(tool => tool.id !== toolId);
      onSelectedToolsChange(updatedTools);
    }
  };

  const handleFunctionEdit = (tool: Tool) => {
    setEditingFunction(tool);
  };

  const handleMCPEdit = (tool: Tool) => {
    setEditingMCP(tool);
  };

  const handleFileSearchEdit = (tool: Tool) => {
    setEditingFileSearch(tool);
  };

  const handleAgenticFileSearchEdit = (tool: Tool) => {
    setEditingAgenticFileSearch(tool);
  };

  // Get tool color based on type
  const getToolColor = (toolId: string) => {
    switch (toolId) {
      case 'mcp_server':
        return 'positive-trend';
      case 'function':
        return 'opportunity';
      case 'file_search':
        return 'critical-alert';
      case 'agentic_file_search':
        return 'negative-trend';
      case 'image_generation':
        return 'neutral';
      case 'think':
        return 'positive-trend';
      default:
        return 'positive-trend';
    }
  };



  return (
    <div className="w-[30%] bg-background border-r border-border h-full overflow-y-auto">
      <div className="p-4 h-full flex flex-col">
        
        {/* Header with Model Selection and Config Icons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <Label className="text-sm font-medium whitespace-nowrap">Model</Label>
              <ModelSelectionModal
                models={allModels}
                selectedModel={getModelString()}
                onModelSelect={handleModelSelect}
                loading={loading}
                error={error}
              />
            </div>
            <div className="flex items-center space-x-2">
              <ConfigurationSettingsModal
                textFormat={textFormat}
                setTextFormat={setTextFormat}
                toolChoice={toolChoice}
                setToolChoice={setToolChoice}
                temperature={temperature}
                setTemperature={setTemperature}
                maxTokens={maxTokens}
                setMaxTokens={setMaxTokens}
                topP={topP}
                setTopP={setTopP}
                jsonSchemaContent={jsonSchemaContent}
                setJsonSchemaContent={setJsonSchemaContent}
                jsonSchemaName={jsonSchemaName}
                setJsonSchemaName={setJsonSchemaName}
              />
            </div>
          </div>
          
          {/* Configuration Parameters */}
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            <span>text_format:</span>
            <span className="text-positive-trend font-medium">{textFormat}</span>
            <span className="ml-2">tool_choice:</span>
            <span className="text-positive-trend font-medium">{toolChoice}</span>
            <span className="ml-2">temp:</span>
            <span className="text-positive-trend font-medium">{temperature}</span>
            <span className="ml-2">tokens:</span>
            <span className="text-positive-trend font-medium">{maxTokens}</span>
          </div>
        </div>

        {/* Tools Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-2">
              <Label className="text-sm font-medium">Tools:</Label>
              
                          {/* Selected Tools */}
            {selectedTools.map((tool, index) => {
              const IconComponent = tool.icon;
              const colorClass = getToolColor(tool.id);
              
              // Get display name based on tool type
              const getDisplayName = (tool: Tool) => {
                if (tool.id === 'function' && tool.functionDefinition) {
                  try {
                    const parsed = JSON.parse(tool.functionDefinition);
                    return parsed.name || 'Function';
                  } catch {
                    return 'Function';
                  }
                }
                if (tool.id === 'file_search' && tool.fileSearchConfig) {
                  return tool.fileSearchConfig.vectorStoreName || 'File Search';
                }
                if (tool.id === 'agentic_file_search' && tool.agenticFileSearchConfig) {
                  return `${tool.agenticFileSearchConfig.vectorStoreName || 'Agentic File Search'} (${tool.agenticFileSearchConfig.iterations})`;
                }
                return tool.name;
              };
              
              const displayName = getDisplayName(tool);
              const isFunction = tool.id === 'function';
              const isMCP = tool.id === 'mcp_server';
              const isFileSearch = tool.id === 'file_search';
              const isAgenticFileSearch = tool.id === 'agentic_file_search';
              const isClickable = isFunction || isMCP || isFileSearch || isAgenticFileSearch;
              const toolKey = (isFunction || isMCP) ? `${tool.id}-${index}` : tool.id;
              
              return (
                <div 
                  key={toolKey}
                  className={`flex items-center space-x-1 bg-positive-trend/10 border border-positive-trend/20 rounded px-2 py-1 focus:ring-2 focus:ring-positive-trend/30 focus:border-positive-trend ${
                    isClickable ? 'cursor-pointer hover:bg-positive-trend/20' : ''
                  }`}
                  tabIndex={0}
                  onClick={
                    isFunction ? () => handleFunctionEdit(tool) :
                    isMCP ? () => handleMCPEdit(tool) :
                    isFileSearch ? () => handleFileSearchEdit(tool) :
                    isAgenticFileSearch ? () => handleAgenticFileSearchEdit(tool) :
                    undefined
                  }
                >
                  <IconComponent className="h-3 w-3 text-positive-trend" />
                  <span className="text-xs text-positive-trend font-medium">
                    {displayName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-positive-trend/20"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the edit handler
                      if (tool.id === 'function') {
                        handleToolRemove(tool.id, tool.functionDefinition);
                      } else if (tool.id === 'mcp_server') {
                        handleToolRemove(tool.id, undefined, index);
                      } else {
                        handleToolRemove(tool.id);
                      }
                    }}
                  >
                    <X className="h-3 w-3 text-positive-trend" />
                  </Button>
                </div>
              );
            })}
            </div>
            
            {/* Add Tool Button */}
            <ToolsSelectionModal
              selectedTools={selectedTools}
              onToolSelect={handleToolSelect}
              editingFunction={editingFunction}
              onEditingFunctionChange={setEditingFunction}
              editingMCP={editingMCP}
              onEditingMCPChange={setEditingMCP}
              editingFileSearch={editingFileSearch}
              onEditingFileSearchChange={setEditingFileSearch}
              editingAgenticFileSearch={editingAgenticFileSearch}
              onEditingAgenticFileSearchChange={setEditingAgenticFileSearch}
              getMCPToolByLabel={getMCPToolByLabel}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:bg-muted/50 focus:bg-positive-trend/10 focus:text-positive-trend"
              >
                +
              </Button>
            </ToolsSelectionModal>
          </div>
        </div>

        {/* System Message - Takes most available space */}
        <div className="flex-1 flex flex-col mt-6 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">System message</Label>
          </div>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe desired model behavior (tone, tool, usage, response style)"
            className="flex-1 text-sm resize-none bg-muted/50 border border-border focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-positive-trend/60 transition-all duration-200"
            style={{ 
              minHeight: '300px',
              boxShadow: 'none !important',
              outline: 'none !important'
            }}
          />
        </div>

        {/* Add messages to prompt - Inline expandable */}
        <div className="mt-4 pb-4">
          <PromptMessagesInline
            promptMessages={promptMessages}
            onAddPromptMessage={onAddPromptMessage}
            onRemovePromptMessage={onRemovePromptMessage}
          />
        </div>

      </div>

      {/* API Keys Modal */}
      <ApiKeysModal
        open={apiKeysModalOpen || openApiKeysModal}
        onOpenChange={(open) => {
          setApiKeysModalOpen(open);
          onApiKeysModalChange(open);
          if (!open) {
            // Clear state when modal closes (regardless of reason)
            setRequiredProvider(undefined);
            setPendingModelSelection(null);
          }
        }}
        onSaveSuccess={() => {
          // Only complete model selection when keys are successfully saved
          if (pendingModelSelection && requiredProvider) {
            // Add a small delay to ensure localStorage is updated
            setTimeout(() => {
              if (checkApiKey(requiredProvider)) {
                const [provider, name] = pendingModelSelection.split('@');
                setModelProvider(provider);
                setModelName(name);
              }
            }, 100);
          }
        }}
        requiredProvider={requiredProvider}
      />
    </div>
  );
};

export default ConfigurationPanel; 