import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
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
  Terminal,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { MCP } from '@lobehub/icons';
import { API_URL } from '@/config';
import ToolConfigModal from './ToolConfigModal';
import ToolsSelectionModal from './ToolsSelectionModal';
import PromptMessagesInline from './PromptMessagesInline';
import ApiKeysModal from './ApiKeysModal';
import ModelSelectionModal from './ModelSelectionModal';
import ConfigurationSettingsModal from './ConfigurationSettingsModal';
import SystemPromptGenerator from './SystemPromptGenerator';
import MCPModal from './MCPModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

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
  fileSearchConfig?: { selectedFiles: string[]; selectedVectorStores: string[]; vectorStoreNames: string[] }; // For file search tools
  agenticFileSearchConfig?: { selectedFiles: string[]; selectedVectorStores: string[]; vectorStoreNames: string[]; iterations: number; maxResults: number }; // For agentic file search tools
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
  // When true, advanced sections (settings, tools, system prompt) are hidden for Masaic Mocky mode
  mockyMode?: boolean;
  className?: string;
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
  setJsonSchemaName,
  mockyMode = false,
  className = ''
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
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  /* ---------------- Mocky Mode data ---------------- */
  const [mockServers, setMockServers] = useState<{id:string,url:string,serverLabel:string}[]>([]);
  const [mockFunctions, setMockFunctions] = useState<any[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [loadingFunctions, setLoadingFunctions] = useState(false);
  const [addServerModalOpen, setAddServerModalOpen] = useState(false);
  const [viewingFunction, setViewingFunction] = useState<any|null>(null);
  const [viewingMocks, setViewingMocks] = useState<string[] | null>(null);
  const [mcpPreview, setMcpPreview] = useState<{tools:any[], serverLabel:string}|null>(null);
  interface MCPTool { name:string; description:string; parameters:any; strict?:boolean; type?:string; }

  useEffect(() => {
    if(mockyMode){
      loadMockServers();
      loadMockFunctions();
    }
  }, [mockyMode]);

  const loadMockServers = async () => {
    setLoadingServers(true);
    try{
      const res = await fetch('http://localhost:6644/v1/dashboard/mcp/mock/servers');
      if(res.ok){
        const data = await res.json();
        setMockServers(data);
      }
    }catch(err){
      console.error(err);
    }finally{
      setLoadingServers(false);
    }
  };

  const loadMockFunctions = async () => {
    setLoadingFunctions(true);
    try{
      const res = await fetch('http://localhost:6644/v1/dashboard/mcp/mock/functions');
      if(res.ok){
        const data = await res.json();
        setMockFunctions(data);
      }
    }catch(err){
      console.error(err);
    }finally{
      setLoadingFunctions(false);
    }
  };

  const loadFunctionMocks = async (funcId: string) => {
    try {
      const res = await fetch(`http://localhost:6644/v1/dashboard/mcp/mock/functions/${funcId}`);
      if (res.ok) {
        const data = await res.json();
        const jsonArr: string[] = data?.mocks?.mockJsons || [];
        setViewingMocks(jsonArr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(instructions);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiUrl = API_URL;
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
      const saved = localStorage.getItem('platform_apiKeys');
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
      // If editing an existing MCP server, remove the old one first
      if (editingMCP) {
        const updatedTools = selectedTools.filter(t => 
          !(t.id === 'mcp_server' && t.mcpConfig?.label === editingMCP.mcpConfig?.label)
        );
        onSelectedToolsChange([...updatedTools, tool]);
      } else {
        // Add the new MCP server
        onSelectedToolsChange([...selectedTools, tool]);
      }
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
      case 'fun_req_gathering_tool':
      case 'fun_def_generation_tool':
        return 'positive-trend';
      case 'mock_fun_save_tool':
        return 'positive-trend';
      case 'mock_generation_tool':
      case 'mock_save_tool':
        return 'positive-trend';
      default:
        return 'positive-trend';
    }
  };

  // --- JSON highlighting helpers (copy from JsonSchemaModal) ---
  const highlightLine = (line: string) => {
    // Regex patterns
    if (line.includes(':') && line.includes('"')) {
      const keyMatch = line.match(/"([^\"]+)"(\s*:)/);
      if (keyMatch) {
        const beforeKey = line.substring(0, line.indexOf(keyMatch[0]));
        const key = keyMatch[1];
        const afterKey = line.substring(line.indexOf(keyMatch[0]) + keyMatch[0].length);
        return (
          <span>
            <span className="text-muted-foreground">{beforeKey}</span>
            <span className="text-positive-trend">"{key}"</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-foreground">{afterKey}</span>
          </span>
        );
      }
    } else if (line.includes('"') && !line.includes(':')) {
      return <span className="text-positive-trend">{line}</span>;
    } else if (line.match(/\b(true|false|null)\b/)) {
      return <span className="text-positive-trend">{line}</span>;
    } else if (line.match(/\b\d+\b/)) {
      return <span className="text-foreground">{line}</span>;
    }
    return <span className="text-muted-foreground">{line}</span>;
  };

  const highlightJson = (jsonString: string) => {
    if (!jsonString.trim()) return null;
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      const lines = formatted.split('\n');
      return (
        <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {lines.map((line, idx) => (<div key={idx}>{highlightLine(line)}</div>))}
        </pre>
      );
    } catch {
      return (
        <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {jsonString}
        </pre>
      );
    }
  };

  const handleServerClick = async (server:{id:string,url:string,serverLabel:string})=>{
    try{
      const res = await fetch(`${'http://localhost:6644'}/v1/dashboard/mcp/list_actions`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ serverLabel: server.serverLabel, serverUrl: server.url, headers:{} })
      });
      if(res.ok){
        const tools: MCPTool[] = await res.json();
        setMcpPreview({tools, serverLabel: server.serverLabel});
      } else {
        toast.error('Failed to load tools');
      }
    }catch(err){ console.error(err); toast.error('Error fetching tools'); }
  };


  return (
    <div className={cn("bg-background border-r border-border h-full overflow-y-auto", className)}>
      <div className="p-4 h-full flex flex-col">
        
        {/* Header with Model Selection and Config Icons */}
        <div className="space-y-3 flex-shrink-0">
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
            {/* Settings icon hidden in Masaic Mocky mode */}
            {!mockyMode && (
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
            )}
          </div>
          
          {/* Configuration Parameters summary hidden in Masaic Mocky mode */}
          {!mockyMode && (
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
          )}
        </div>

        {/* Tools Section (hidden in Masaic Mocky mode) */}
        {!mockyMode && (
        <div className="mt-6 flex-shrink-0">
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
                  return tool.fileSearchConfig.vectorStoreNames.length > 0 ? tool.fileSearchConfig.vectorStoreNames.join(', ') : 'File Search';
                }
                if (tool.id === 'agentic_file_search' && tool.agenticFileSearchConfig) {
                  const displayName = tool.agenticFileSearchConfig.vectorStoreNames.length > 0 ? tool.agenticFileSearchConfig.vectorStoreNames.join(', ') : 'Agentic File Search';
                  return `${displayName} (${tool.agenticFileSearchConfig.iterations})`;
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
        )}

        {/* Mocky Mode Lists */}
        {mockyMode && (
          <div className="mt-6 flex flex-col flex-grow min-h-0 space-y-6">
            {/* Mock Servers List */}
            <Card className="flex flex-col flex-1 min-h-0">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h4 className="text-sm font-medium">Mock Servers</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddServerModalOpen(true)}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 space-y-2 flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth:'thin' }}>
                {loadingServers ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : mockServers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No mock servers found.</p>
                ) : (
                  mockServers.map(server => (
                    <div key={server.id} className="flex items-start justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-positive-trend/20 border-border/20 hover:border-positive-trend/40 hover:bg-positive-trend/5" onClick={() => handleServerClick(server)}>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold text-foreground truncate">{server.serverLabel}</h5>
                        <p className="text-xs text-muted-foreground truncate">{server.url}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e)=>{e.stopPropagation(); navigator.clipboard.writeText(server.url); toast.success('Server URL copied');}}
                        className="border-border text-foreground hover:bg-positive-trend/10 focus:outline-none focus:ring-2 focus:ring-positive-trend/50"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Mock Functions List */}
            <Card className="flex flex-col flex-1 min-h-0">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h4 className="text-sm font-medium">Mock Functions</h4>
              </div>
              <div className="p-4 space-y-2 flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth:'thin' }}>
                {loadingFunctions ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : mockFunctions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No mock functions found.</p>
                ) : (
                  mockFunctions.map(func => (
                    <div key={func.id} className="p-3 rounded-lg border transition-all duration-200 border-border/20 hover:border-positive-trend/40 hover:bg-positive-trend/5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-foreground truncate max-w-[160px]">{func.name}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { navigator.clipboard.writeText(func.id); toast.success('Function ID copied'); }}
                              className="border-border text-foreground hover:bg-positive-trend/10 focus:outline-none focus:ring-2 focus:ring-positive-trend/50"
                              title="Copy ID"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{func.description}</p>
                        </div>
                        <div className="flex-shrink-0 flex flex-row items-center space-x-2 pl-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs bg-positive-trend/10 text-positive-trend hover:bg-positive-trend/20 focus:outline-none focus:ring-2 focus:ring-positive-trend/20 rounded-full"
                            onClick={() => setViewingFunction(func)}
                          >
                            View Function
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs bg-positive-trend/10 text-positive-trend hover:bg-positive-trend/20 focus:outline-none focus:ring-2 focus:ring-positive-trend/20 rounded-full"
                            onClick={() => loadFunctionMocks(func.id)}
                          >
                            View Mocks
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Add Mock Server Modal (blank) */}
            <Dialog open={addServerModalOpen} onOpenChange={setAddServerModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Mock Server</DialogTitle>
                  <DialogDescription>
                    {/* Blank modal per requirement */}
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            {/* Function Detail Modal */}
            <Dialog open={!!viewingFunction} onOpenChange={(open)=>{ if(!open) setViewingFunction(null); }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Function Details</DialogTitle>
                  <DialogDescription className="max-h-[70vh] overflow-y-auto">
                    <div className="bg-muted/50 border border-border rounded-lg p-4 max-h-[60vh] overflow-auto" style={{ scrollbarWidth:'thin' }}>
                      {highlightJson(viewingFunction ? JSON.stringify(viewingFunction, null, 2) : '')}
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            {/* Function Mocks Modal */}
            <Dialog open={viewingMocks !== null} onOpenChange={(open)=>{ if(!open) setViewingMocks(null); }}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Function Mocks</DialogTitle>
                  <DialogDescription className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {viewingMocks?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No mocks available.</p>
                    )}
                    {viewingMocks?.map((mockJson, idx)=>(
                      <div key={idx} className="bg-muted/50 border border-border rounded-lg p-4 overflow-auto" style={{ scrollbarWidth:'thin' }}>
                        {highlightJson(mockJson)}
                      </div>
                    ))}
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            {/* MCP Server Preview Modal (read-only) */}
            {mcpPreview && (
              <MCPModal
                open={true}
                onOpenChange={(open)=>{ if(!open) setMcpPreview(null); }}
                onConnect={()=>{}}
                readOnly
                preloadedTools={mcpPreview.tools}
                initialConfig={{ url:'', label:mcpPreview.serverLabel, authentication:'none', selectedTools:[] }}
              />
            )}
          </div>
        )}

        {/* System Message - hidden in Masaic Mocky mode */}
        {!mockyMode && (
        <div className="mt-6 flex flex-col flex-grow min-h-0">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <Label className="text-sm font-medium">System message</Label>
            <SystemPromptGenerator 
              onGenerate={setInstructions} 
              existingPrompt={instructions} 
              isLoading={isGeneratingPrompt}
              onLoadingChange={setIsGeneratingPrompt}
            />
          </div>
          <div className="relative flex-grow min-h-0">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground z-10"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe desired model behavior (tone, tool, usage, response style)"
              className="h-full w-full text-sm resize-none bg-muted/50 border border-border focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-positive-trend/60 transition-all duration-200"
              style={{ 
                boxShadow: 'none !important',
                outline: 'none !important'
              }}
              disabled={isGeneratingPrompt}
            />
            {isGeneratingPrompt && (
              <div className="absolute inset-0 bg-muted/50 border border-border rounded-md flex items-center justify-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-2 border-positive-trend border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">Generating prompt...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Remove or comment out the PromptMessagesInline component */}
        {/* <PromptMessagesInline
          promptMessages={promptMessages}
          onAddPromptMessage={onAddPromptMessage}
          onRemovePromptMessage={onRemovePromptMessage}
        /> */}

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