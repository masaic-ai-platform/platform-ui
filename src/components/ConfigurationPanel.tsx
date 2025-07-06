import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import ToolConfigModal from './ToolConfigModal';
import PromptMessagesInline from './PromptMessagesInline';
import ModelSelectionModal from './ModelSelectionModal';

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
  
  // System message
  instructions: string;
  setInstructions: (instructions: string) => void;
  
  // Prompt messages
  promptMessages?: PromptMessage[];
  onAddPromptMessage?: (message: PromptMessage) => void;
  onRemovePromptMessage?: (id: string) => void;
  
  // Vector store
  selectedVectorStore: string;
  onVectorStoreSelect: (vectorStoreId: string | null) => void;
  
  // Actions
  onResetConversation: () => void;
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
  instructions,
  setInstructions,
  promptMessages = [],
  onAddPromptMessage = () => {},
  onRemovePromptMessage = () => {},
  selectedVectorStore,
  onVectorStoreSelect,
  onResetConversation
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Get all available models from providers
  const getAllModels = () => {
    return providers.flatMap(provider => 
      provider.supportedModels.map(model => ({
        ...model,
        providerName: provider.name,
        providerDescription: provider.description
      }))
    );
  };

  const getModelString = () => `${modelProvider}@${modelName}`;

  const handleModelSelect = (modelSyntax: string) => {
    const [provider, name] = modelSyntax.split('@');
    setModelProvider(provider);
    setModelName(name);
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

  const allModels = getAllModels();

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
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Model configuration"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Configuration Parameters */}
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            <span>text_format:</span>
            <span className="text-positive-trend font-medium">json_object</span>
            <span className="ml-2">tool_choice:</span>
            <span className="text-positive-trend font-medium">auto</span>
            <span className="ml-2">temp:</span>
            <span className="text-positive-trend font-medium">{temperature}</span>
            <span className="ml-2">tokens:</span>
            <span className="text-positive-trend font-medium">{maxTokens}</span>
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Tools</Label>
            <ToolConfigModal
              selectedVectorStore={selectedVectorStore}
              onVectorStoreSelect={onVectorStoreSelect}
              imageModelProvider={imageModelProvider}
              setImageModelProvider={setImageModelProvider}
              imageModelName={imageModelName}
              setImageModelName={setImageModelName}
              imageProviderKey={imageProviderKey}
              setImageProviderKey={setImageProviderKey}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
              >
                +
              </Button>
            </ToolConfigModal>
          </div>
          
          {/* Active Tools */}
          {selectedVectorStore && (
            <div className="flex items-center space-x-2 bg-positive-trend/10 border border-positive-trend/20 rounded px-2 py-1">
              <Search className="h-3 w-3 text-positive-trend" />
              <span className="text-xs text-positive-trend font-medium">file_search</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-auto"
                onClick={() => onVectorStoreSelect(null)}
              >
                ×
              </Button>
            </div>
          )}
          
          {imageProviderKey && (
            <div className="flex items-center space-x-2 bg-opportunity/10 border border-opportunity/20 rounded px-2 py-1">
              <Image className="h-3 w-3 text-opportunity" />
              <span className="text-xs text-opportunity font-medium">image_generation</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-auto"
                onClick={() => setImageProviderKey('')}
              >
                ×
              </Button>
            </div>
          )}
        </div>

        {/* System Message - Takes most available space */}
        <div className="flex-1 flex flex-col mt-6 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">System message</Label>
          </div>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="You are a helpful assistant..."
            className="flex-1 text-sm resize-none focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-positive-trend/60 transition-all duration-200"
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
    </div>
  );
};

export default ConfigurationPanel; 