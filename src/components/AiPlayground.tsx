import React, { useState, useRef, useEffect } from 'react';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import UnifiedCard from '@/components/ui/unified-card';
import { Loader2, Send, Sparkles, RotateCcw, Copy, Check, Menu, Code } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import ConfigurationPanel from './ConfigurationPanel';
import PlaygroundSidebar from './PlaygroundSidebar';
import CodeTabs from '@/playground/CodeTabs';
import { PlaygroundRequest } from '@/playground/PlaygroundRequest';

interface ToolExecution {
  serverName: string;
  toolName: string;
  status: 'in_progress' | 'completed';
  agenticSearchLogs?: AgenticSearchLog[];
}

interface AgenticSearchLog {
  iteration: number;
  query: string;
  reasoning: string;
  citations: string[];
  remaining_iterations: number;
}

interface ContentBlock {
  type: 'text' | 'tool_progress' | 'inline_loading';
  content?: string;
  toolExecutions?: ToolExecution[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contentBlocks?: ContentBlock[];
  type: 'text' | 'image';
  timestamp: Date;
  hasThinkTags?: boolean;
  isLoading?: boolean;
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

const getProviderApiKey = (provider: string): string => {
  try {
    const saved = localStorage.getItem('platform_apiKeys');
    if (!saved) return '';
    const savedKeys: { name: string; apiKey: string }[] = JSON.parse(saved);
    return savedKeys.find(item => item.name === provider)?.apiKey || '';
  } catch {
    return '';
  }
};

const AiPlayground: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');
  const [modelProvider, setModelProvider] = useState('openai');
  const [modelName, setModelName] = useState('gpt-4o');
  const [imageModelProvider, setImageModelProvider] = useState('gemini');
  const [imageModelName, setImageModelName] = useState('imagen-3.0-generate-002');
  const [imageProviderKey, setImageProviderKey] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);
  const [selectedVectorStore, setSelectedVectorStore] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  
  // Configuration parameters for AI model
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(1.0);
  const [storeLogs, setStoreLogs] = useState(true);
  const [textFormat, setTextFormat] = useState<'text' | 'json_object' | 'json_schema'>('text');
  const [toolChoice, setToolChoice] = useState<'auto' | 'none'>('auto');
  
  // Prompt messages state
  const [promptMessages, setPromptMessages] = useState<PromptMessage[]>([]);
  
  // Tools state
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  
  // Playground state
  const [activeTab, setActiveTab] = useState('responses');
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  
  const [jsonSchemaContent, setJsonSchemaContent] = useState('');
  const [jsonSchemaName, setJsonSchemaName] = useState<string | null>(null);

  // Chat header state
  const [copiedResponseId, setCopiedResponseId] = useState(false);
  
  // Code snippet generator state
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<PlaygroundRequest | null>(null);
  
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_DASHBOARD_API_URL || 'http://localhost:6644';

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedBaseUrl = localStorage.getItem('aiPlayground_baseUrl') || 'http://localhost:8080';
    const savedModelProvider = localStorage.getItem('platform_modelProvider') || 'openai';
    const savedModelName = localStorage.getItem('platform_modelName') || 'gpt-4o';
    const savedImageModelProvider = localStorage.getItem('aiPlayground_imageModelProvider') || 'gemini';
    const savedImageModelName = localStorage.getItem('aiPlayground_imageModelName') || 'imagen-3.0-generate-002';
    const savedImageProviderKey = localStorage.getItem('aiPlayground_imageProviderKey') || '';
    const savedSelectedVectorStore = localStorage.getItem('aiPlayground_selectedVectorStore') || '';
    const savedInstructions = localStorage.getItem('platform_instructions') || '';
    const savedTemperature = parseFloat(localStorage.getItem('aiPlayground_temperature') || '1.0');
    const savedMaxTokens = parseInt(localStorage.getItem('aiPlayground_maxTokens') || '2048');
    const savedTopP = parseFloat(localStorage.getItem('aiPlayground_topP') || '1.0');
    const savedStoreLogs = localStorage.getItem('aiPlayground_storeLogs') === 'true';
    const savedTextFormat = (localStorage.getItem('aiPlayground_textFormat') || 'text') as 'text' | 'json_object' | 'json_schema';
    const savedToolChoice = (localStorage.getItem('aiPlayground_toolChoice') || 'auto') as 'auto' | 'none';
    const savedPromptMessages = JSON.parse(localStorage.getItem('aiPlayground_promptMessages') || '[]');
    const savedOtherTools = JSON.parse(localStorage.getItem('aiPlayground_otherTools') || '[]');
    const savedMCPTools = loadMCPToolsFromStorage();
    const savedFileSearchTools = loadFileSearchToolsFromStorage();
    const savedAgenticFileSearchTools = loadAgenticFileSearchToolsFromStorage();
    
    // Don't load apiKey from localStorage - it's managed by getProviderApiKey function
    setBaseUrl(savedBaseUrl);
    setModelProvider(savedModelProvider);
    setModelName(savedModelName);
    setImageModelProvider(savedImageModelProvider);
    setImageModelName(savedImageModelName);
    setImageProviderKey(savedImageProviderKey);
    setSelectedVectorStore(savedSelectedVectorStore);
    setInstructions(savedInstructions);
    setTemperature(savedTemperature);
    setMaxTokens(savedMaxTokens);
    setTopP(savedTopP);
    setStoreLogs(savedStoreLogs);
    setTextFormat(savedTextFormat);
    setToolChoice(savedToolChoice);
    setPromptMessages(savedPromptMessages);
    setSelectedTools([...savedOtherTools, ...savedMCPTools, ...savedFileSearchTools, ...savedAgenticFileSearchTools]);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    // Don't save platform_apiKeys here - it's managed by ApiKeysModal
    localStorage.setItem('aiPlayground_baseUrl', baseUrl);
    localStorage.setItem('platform_modelProvider', modelProvider);
    localStorage.setItem('platform_modelName', modelName);
    localStorage.setItem('aiPlayground_imageModelProvider', imageModelProvider);
    localStorage.setItem('aiPlayground_imageModelName', imageModelName);
    localStorage.setItem('aiPlayground_imageProviderKey', imageProviderKey);
    localStorage.setItem('aiPlayground_selectedVectorStore', selectedVectorStore);
    localStorage.setItem('platform_instructions', instructions);
    localStorage.setItem('aiPlayground_temperature', temperature.toString());
    localStorage.setItem('aiPlayground_maxTokens', maxTokens.toString());
    localStorage.setItem('aiPlayground_topP', topP.toString());
    localStorage.setItem('aiPlayground_storeLogs', storeLogs.toString());
    localStorage.setItem('aiPlayground_textFormat', textFormat);
    localStorage.setItem('aiPlayground_toolChoice', toolChoice);
    localStorage.setItem('aiPlayground_promptMessages', JSON.stringify(promptMessages));
    
    // Separate tools by type for better management
    const mcpTools = selectedTools.filter(tool => tool.id === 'mcp_server');
    const fileSearchTools = selectedTools.filter(tool => tool.id === 'file_search');
    const agenticFileSearchTools = selectedTools.filter(tool => tool.id === 'agentic_file_search');
    const otherTools = selectedTools.filter(tool => 
      tool.id !== 'mcp_server' && 
      tool.id !== 'file_search' && 
      tool.id !== 'agentic_file_search'
    );
    
    saveMCPToolsToStorage(mcpTools);
    saveFileSearchToolsToStorage(fileSearchTools);
    saveAgenticFileSearchToolsToStorage(agenticFileSearchTools);
    localStorage.setItem('aiPlayground_otherTools', JSON.stringify(otherTools));
  }, [apiKey, baseUrl, modelProvider, modelName, imageModelProvider, imageModelName, imageProviderKey, selectedVectorStore, instructions, temperature, maxTokens, topP, storeLogs, textFormat, toolChoice, promptMessages, selectedTools]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    setPreviousResponseId(null);
    toast.success('Conversation reset');
  };

  // Function to clear all localStorage data (for testing/debugging)
  const clearAllStorageData = () => {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('aiPlayground_') || key.startsWith('platform_')
    );
    keys.forEach(key => localStorage.removeItem(key));
    toast.success('All storage data cleared');
  };

  const handleVectorStoreSelect = (vectorStoreId: string | null) => {
    setSelectedVectorStore(vectorStoreId || '');
    localStorage.setItem('aiPlayground_selectedVectorStore', vectorStoreId || '');
    
    if (vectorStoreId) {
      toast.success('Vector store selected for file search');
    } else {
      toast.success('Vector store deselected');
    }
  };

  const handleAddPromptMessage = (message: PromptMessage) => {
    setPromptMessages(prev => [...prev, message]);
    toast.success(`${message.role === 'user' ? 'User' : 'Assistant'} message added to prompt`);
  };

  const handleRemovePromptMessage = (id: string) => {
    setPromptMessages(prev => prev.filter(msg => msg.id !== id));
    toast.success('Message removed from prompt');
  };

  const handleCopyResponseId = async () => {
    if (!previousResponseId) return;
    
    try {
      await navigator.clipboard.writeText(previousResponseId);
      setCopiedResponseId(true);
      setTimeout(() => setCopiedResponseId(false), 2000);
      toast.success('Response ID copied to clipboard');
    } catch (err) {
      console.error('Failed to copy response ID:', err);
      toast.error('Failed to copy response ID');
    }
  };

  // Enhanced MCP tools persistence using label as key
  const saveMCPToolsToStorage = (tools: Tool[]) => {
    const mcpTools = tools.filter(tool => tool.id === 'mcp_server' && tool.mcpConfig?.label);
    const mcpToolsMap: Record<string, any> = {};
    
    mcpTools.forEach(tool => {
      const label = tool.mcpConfig.label;
      mcpToolsMap[label] = {
        label: tool.mcpConfig.label,
        url: tool.mcpConfig.url,
        authentication: tool.mcpConfig.authentication,
        accessToken: tool.mcpConfig.accessToken,
        customHeaders: tool.mcpConfig.customHeaders,
        selectedTools: tool.mcpConfig.selectedTools
      };
    });
    
    localStorage.setItem('platform_mcpTools', JSON.stringify(mcpToolsMap));
  };

  const loadMCPToolsFromStorage = (): Tool[] => {
    try {
      const stored = localStorage.getItem('platform_mcpTools');
      if (!stored) return [];
      
      const mcpToolsMap = JSON.parse(stored);
      const mcpTools: Tool[] = [];
      
      Object.values(mcpToolsMap).forEach((config: any) => {
        if (config.label) {
          mcpTools.push({
            id: 'mcp_server',
            name: config.label,
            icon: () => null, // Icon will be set by the component
            mcpConfig: config
          });
        }
      });
      
      return mcpTools;
    } catch (error) {
      console.error('Error loading MCP tools from storage:', error);
      return [];
    }
  };

  const getMCPToolByLabel = (label: string) => {
    try {
      const stored = localStorage.getItem('platform_mcpTools');
      if (!stored) return null;
      
      const mcpToolsMap = JSON.parse(stored);
      return mcpToolsMap[label] || null;
    } catch (error) {
      console.error('Error getting MCP tool by label:', error);
      return null;
    }
  };

  // File search tools persistence
  const loadFileSearchToolsFromStorage = (): Tool[] => {
    try {
      const stored = localStorage.getItem('platform_fileSearchTools');
      if (!stored) return [];
      
      const fileSearchToolsMap = JSON.parse(stored);
      const fileSearchTools: Tool[] = [];
      
      Object.values(fileSearchToolsMap).forEach((config: any) => {
        if (config.selectedVectorStores && config.vectorStoreNames && config.selectedVectorStores.length > 0) {
          const displayName = config.vectorStoreNames.join(', ');
          fileSearchTools.push({
            id: 'file_search',
            name: displayName,
            icon: () => null, // Icon will be set by the component
            fileSearchConfig: {
              selectedFiles: config.selectedFiles,
              selectedVectorStores: config.selectedVectorStores,
              vectorStoreNames: config.vectorStoreNames
            }
          });
        }
      });
      
      return fileSearchTools;
    } catch (error) {
      console.error('Error loading file search tools from storage:', error);
      return [];
    }
  };

  // Agentic file search tools persistence
  const loadAgenticFileSearchToolsFromStorage = (): Tool[] => {
    try {
      const stored = localStorage.getItem('platform_agenticFileSearchTools');
      if (!stored) return [];
      
      const agenticFileSearchToolsMap = JSON.parse(stored);
      const agenticFileSearchTools: Tool[] = [];
      
      Object.values(agenticFileSearchToolsMap).forEach((config: any) => {
        if (config.selectedVectorStores && config.vectorStoreNames && config.selectedVectorStores.length > 0) {
          const displayName = config.vectorStoreNames.join(', ');
          agenticFileSearchTools.push({
            id: 'agentic_file_search',
            name: displayName,
            icon: () => null, // Icon will be set by the component
            agenticFileSearchConfig: {
              selectedFiles: config.selectedFiles,
              selectedVectorStores: config.selectedVectorStores,
              vectorStoreNames: config.vectorStoreNames,
              iterations: config.iterations,
              maxResults: config.maxResults || 4 // Default to 4 if not set
            }
          });
        }
      });
      
      return agenticFileSearchTools;
    } catch (error) {
      console.error('Error loading agentic file search tools from storage:', error);
      return [];
    }
  };

  const saveFileSearchToolsToStorage = (tools: Tool[]) => {
    const fileSearchTools = tools.filter(tool => tool.id === 'file_search' && tool.fileSearchConfig?.selectedVectorStores && tool.fileSearchConfig.selectedVectorStores.length > 0);
    const fileSearchToolsMap: Record<string, any> = {};
    
    fileSearchTools.forEach(tool => {
      const combinedKey = tool.fileSearchConfig!.selectedVectorStores.sort().join('|');
      fileSearchToolsMap[combinedKey] = {
        selectedFiles: tool.fileSearchConfig!.selectedFiles,
        selectedVectorStores: tool.fileSearchConfig!.selectedVectorStores,
        vectorStoreNames: tool.fileSearchConfig!.vectorStoreNames,
        lastUpdated: new Date().toISOString()
      };
    });
    
    localStorage.setItem('platform_fileSearchTools', JSON.stringify(fileSearchToolsMap));
  };

  const saveAgenticFileSearchToolsToStorage = (tools: Tool[]) => {
    const agenticFileSearchTools = tools.filter(tool => tool.id === 'agentic_file_search' && tool.agenticFileSearchConfig?.selectedVectorStores && tool.agenticFileSearchConfig.selectedVectorStores.length > 0);
    const agenticFileSearchToolsMap: Record<string, any> = {};
    
    agenticFileSearchTools.forEach(tool => {
      const combinedKey = tool.agenticFileSearchConfig!.selectedVectorStores.sort().join('|');
      agenticFileSearchToolsMap[combinedKey] = {
        selectedFiles: tool.agenticFileSearchConfig!.selectedFiles,
        selectedVectorStores: tool.agenticFileSearchConfig!.selectedVectorStores,
        vectorStoreNames: tool.agenticFileSearchConfig!.vectorStoreNames,
        iterations: tool.agenticFileSearchConfig!.iterations,
        maxResults: tool.agenticFileSearchConfig!.maxResults,
        lastUpdated: new Date().toISOString()
      };
    });
    
    localStorage.setItem('platform_agenticFileSearchTools', JSON.stringify(agenticFileSearchToolsMap));
  };

  const generateResponse = async (prompt: string) => {
    const provider = modelProvider;
    const apiKeyForProvider = getProviderApiKey(provider);
    if (!apiKeyForProvider) {
      toast.error('Please set your API key for the selected provider.');
      return;
    }

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: prompt,
      type: 'text',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessageId = Date.now().toString() + '_assistant';
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      type: 'text',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Build API request
    const input = [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt
          }
        ]
      }
    ];

    let textFormatBlock: any = { type: textFormat };
    if (textFormat === 'json_schema') {
      let schema = null;
      let schemaName = jsonSchemaName;
      try {
        if (jsonSchemaContent) {
          const parsed = JSON.parse(jsonSchemaContent);
          schema = parsed.schema;
          schemaName = parsed.name || schemaName;
        }
      } catch {}
      if (!schema || !schemaName) {
        const errorMsg = 'JSON schema is missing or invalid. Please define a valid schema in settings.';
        toast.error(errorMsg);
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: errorMsg,
                type: 'text',
                hasThinkTags: false,
                isLoading: false
              }
            : msg
        ));
        setIsLoading(false);
        return;
      }
      textFormatBlock = {
        type: 'json_schema',
        name: schemaName,
        schema
      };
    }

    const requestBody: any = {
      model: `${modelProvider}@${modelName}`,
      instructions: instructions,
      input,
      text: {
        format: textFormatBlock
      },
      temperature,
      max_output_tokens: maxTokens,
      top_p: topP,
      store: true,
      stream: true
    };
    
    // Add tools if any are selected
    if (selectedTools.length > 0) {
      requestBody.tools = selectedTools.map(tool => {
        if (tool.id === 'mcp_server' && tool.mcpConfig) {
          return {
            type: 'mcp',
            server_label: tool.mcpConfig.label,
            server_url: tool.mcpConfig.url,
            allowed_tools: tool.mcpConfig.selectedTools,
            headers: tool.mcpConfig.authentication === 'access_token' && tool.mcpConfig.accessToken
              ? { 'Authorization': `Bearer ${tool.mcpConfig.accessToken}` }
              : tool.mcpConfig.authentication === 'custom_headers' && tool.mcpConfig.customHeaders
              ? tool.mcpConfig.customHeaders.reduce((acc: any, header: any) => {
                  if (header.key && header.value) {
                    acc[header.key] = header.value;
                  }
                  return acc;
                }, {})
              : {}
          };
        } else         if (tool.id === 'file_search' && tool.fileSearchConfig) {
          // Add file search tool
          return {
            type: 'file_search',
            vector_store_ids: tool.fileSearchConfig.selectedVectorStores
          };
        } else if (tool.id === 'agentic_file_search' && tool.agenticFileSearchConfig) {
          // Add agentic file search tool with proper agentic_search type
          return {
            type: 'agentic_search',
            vector_store_ids: tool.agenticFileSearchConfig.selectedVectorStores,
            max_iterations: tool.agenticFileSearchConfig.iterations,
            max_num_results: tool.agenticFileSearchConfig.maxResults
          };
        }
        // Add other tool types as needed
        return null;
      }).filter(Boolean);
    }
    
    if (previousResponseId) {
      requestBody.previous_response_id = previousResponseId;
    }

    // Capture request for code snippet generation
    const playgroundRequest: PlaygroundRequest = {
      method: 'POST',
      url: '/v1/responses',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyForProvider}`
      },
      body: requestBody
    };
    setLastRequest(playgroundRequest);

    try {
      const response = await fetch(`${apiUrl}/v1/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyForProvider}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `Error: ${errorText}`,
                type: 'text',
                hasThinkTags: false,
                isLoading: false
              }
            : msg
        ));
        setIsLoading(false);
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamingContent = '';
      let responseId = '';
      let isStreaming = false;
      let contentBlocks: ContentBlock[] = [];
      let currentTextBlock: ContentBlock | null = null;
      let activeToolExecutions = new Map<string, ToolExecution>();

      const updateMessage = (blocks: ContentBlock[], fullContent: string) => {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: fullContent,
                contentBlocks: [...blocks],
                type: 'text',
                hasThinkTags: false,
                isLoading: false
              }
            : msg
        ));
      };

      const addInlineLoading = (blocks: ContentBlock[]) => {
        // Remove any existing inline loading blocks first
        const blocksWithoutLoading = blocks.filter(block => block.type !== 'inline_loading');
        // Add new inline loading block at the end
        return [...blocksWithoutLoading, { type: 'inline_loading' as const }];
      };

      const removeInlineLoading = (blocks: ContentBlock[]) => {
        return blocks.filter(block => block.type !== 'inline_loading');
      };

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  // Handle different event types
                  if (data.type === 'response.completed') {
                    if (data.response?.id) {
                      responseId = data.response.id;
                    }
                  } else if (data.type === 'response.output_text.delta') {
                    // Start or continue streaming
                    if (!isStreaming) {
                      isStreaming = true;
                    }
                    
                    if (data.delta) {
                      streamingContent += data.delta;
                      
                      // Create or update current text block
                      if (!currentTextBlock) {
                        currentTextBlock = { type: 'text', content: data.delta };
                        contentBlocks.push(currentTextBlock);
                      } else {
                        currentTextBlock.content = (currentTextBlock.content || '') + data.delta;
                      }
                      
                      // Check if we have a complete JSON object for real-time formatting
                      let displayContent = streamingContent;
                      if (textFormat === 'json_object' || textFormat === 'json_schema') {
                        try {
                          JSON.parse(streamingContent);
                          displayContent = streamingContent;
                        } catch {
                          displayContent = streamingContent;
                        }
                      }
                      
                      // Remove any inline loading when text streaming starts
                      const blocksWithoutLoading = removeInlineLoading(contentBlocks);
                      updateMessage(blocksWithoutLoading, displayContent);
                    }
                  } else if (data.type === 'response.output_text.done') {
                    // Streaming completed for this output
                    isStreaming = false;
                    currentTextBlock = null; // Reset for potential next text stream
                    if (data.text) {
                      streamingContent = data.text;
                      // Update the last text block with complete content
                      for (let i = contentBlocks.length - 1; i >= 0; i--) {
                        if (contentBlocks[i].type === 'text') {
                          contentBlocks[i].content = data.text;
                          break;
                        }
                      }
                      updateMessage(contentBlocks, streamingContent);
                    }
                  } else if (data.type && data.type.startsWith('response.mcp_call.')) {
                    // Handle MCP tool events
                    const typeParts = data.type.split('.');
                    if (typeParts.length >= 4) {
                      const toolIdentifier = typeParts[2];
                      const status = typeParts[3];
                      
                      // Parse tool identifier: myshopify_search_shop_catalog
                      const identifierParts = toolIdentifier.split('_');
                      const serverName = identifierParts[0];
                      const toolName = identifierParts.slice(1).join('_');
                      
                      if (status === 'in_progress') {
                        // Add new tool execution
                        const toolExecution: ToolExecution = {
                          serverName,
                          toolName,
                          status: 'in_progress'
                        };
                        activeToolExecutions.set(toolIdentifier, toolExecution);
                        
                        // Find existing tool progress block or create new one
                        let toolProgressBlock = contentBlocks.find(block => block.type === 'tool_progress');
                        if (!toolProgressBlock) {
                          toolProgressBlock = {
                            type: 'tool_progress',
                            toolExecutions: Array.from(activeToolExecutions.values())
                          };
                          contentBlocks.push(toolProgressBlock);
                        } else {
                          // Update existing tool progress block
                          toolProgressBlock.toolExecutions = Array.from(activeToolExecutions.values());
                        }
                        currentTextBlock = null; // Reset text block for potential next text
                        
                        updateMessage(contentBlocks, streamingContent);
                      } else if (status === 'completed') {
                        // Update tool execution status
                        const toolExecution = activeToolExecutions.get(toolIdentifier);
                        if (toolExecution) {
                          toolExecution.status = 'completed';
                          
                                                  // Update the last tool progress block
                        for (let i = contentBlocks.length - 1; i >= 0; i--) {
                          if (contentBlocks[i].type === 'tool_progress') {
                            contentBlocks[i].toolExecutions = Array.from(activeToolExecutions.values());
                            break;
                          }
                        }
                          
                          // Add inline loading when tools complete, indicating we're waiting for next text stream
                          const blocksWithLoading = addInlineLoading(contentBlocks);
                          updateMessage(blocksWithLoading, streamingContent);
                        }
                      }
                    }
                  } else if (data.type === 'response.file_search.in_progress') {
                    // Handle file search tool start event
                    const toolExecution: ToolExecution = {
                      serverName: 'file_search',
                      toolName: 'search',
                      status: 'in_progress'
                    };
                    activeToolExecutions.set('file_search', toolExecution);
                    
                    // Find existing tool progress block or create new one
                    let toolProgressBlock = contentBlocks.find(block => block.type === 'tool_progress');
                    if (!toolProgressBlock) {
                      toolProgressBlock = {
                        type: 'tool_progress',
                        toolExecutions: Array.from(activeToolExecutions.values())
                      };
                      contentBlocks.push(toolProgressBlock);
                    } else {
                      // Update existing tool progress block
                      toolProgressBlock.toolExecutions = Array.from(activeToolExecutions.values());
                    }
                    currentTextBlock = null; // Reset text block for potential next text
                    
                    updateMessage(contentBlocks, streamingContent);
                  } else if (data.type === 'response.file_search.completed') {
                    // Handle file search tool completion event
                    const toolExecution = activeToolExecutions.get('file_search');
                    if (toolExecution) {
                      toolExecution.status = 'completed';
                      
                      // Update the last tool progress block
                      for (let i = contentBlocks.length - 1; i >= 0; i--) {
                        if (contentBlocks[i].type === 'tool_progress') {
                          contentBlocks[i].toolExecutions = Array.from(activeToolExecutions.values());
                          break;
                        }
                      }
                      
                      // Add inline loading when tools complete, indicating we're waiting for next text stream
                      const blocksWithLoading = addInlineLoading(contentBlocks);
                      updateMessage(blocksWithLoading, streamingContent);
                    }
                  } else if (data.type === 'response.agentic_search.in_progress') {
                    // Handle agentic search tool start event
                    const toolExecution: ToolExecution = {
                      serverName: 'agentic_search',
                      toolName: 'search',
                      status: 'in_progress',
                      agenticSearchLogs: []
                    };
                    activeToolExecutions.set('agentic_search', toolExecution);
                    
                    // Find existing tool progress block or create new one
                    let toolProgressBlock = contentBlocks.find(block => block.type === 'tool_progress');
                    if (!toolProgressBlock) {
                      toolProgressBlock = {
                        type: 'tool_progress',
                        toolExecutions: Array.from(activeToolExecutions.values())
                      };
                      contentBlocks.push(toolProgressBlock);
                    } else {
                      // Update existing tool progress block
                      toolProgressBlock.toolExecutions = Array.from(activeToolExecutions.values());
                    }
                    currentTextBlock = null; // Reset text block for potential next text
                    
                    updateMessage(contentBlocks, streamingContent);
                  } else if (data.type === 'response.agentic_search.query_phase.iteration') {
                    // Handle agentic search iteration logs
                    const toolExecution = activeToolExecutions.get('agentic_search');
                    if (toolExecution && data.iteration && data.query) {
                      const logEntry: AgenticSearchLog = {
                        iteration: data.iteration,
                        query: data.query,
                        reasoning: data.reasoning || '',
                        citations: data.citations || [],
                        remaining_iterations: data.remaining_iterations || 0
                      };
                      
                      if (!toolExecution.agenticSearchLogs) {
                        toolExecution.agenticSearchLogs = [];
                      }
                      toolExecution.agenticSearchLogs.push(logEntry);
                      
                      // Update the tool progress block
                      for (let i = contentBlocks.length - 1; i >= 0; i--) {
                        if (contentBlocks[i].type === 'tool_progress') {
                          contentBlocks[i].toolExecutions = Array.from(activeToolExecutions.values());
                          break;
                        }
                      }
                      
                      updateMessage(contentBlocks, streamingContent);
                    }
                  } else if (data.type === 'response.agentic_search.completed') {
                    // Handle agentic search tool completion event
                    const toolExecution = activeToolExecutions.get('agentic_search');
                    if (toolExecution) {
                      toolExecution.status = 'completed';
                      
                      // Update the last tool progress block
                      for (let i = contentBlocks.length - 1; i >= 0; i--) {
                        if (contentBlocks[i].type === 'tool_progress') {
                          contentBlocks[i].toolExecutions = Array.from(activeToolExecutions.values());
                          break;
                        }
                      }
                      
                      // Add inline loading when tools complete, indicating we're waiting for next text stream
                      const blocksWithLoading = addInlineLoading(contentBlocks);
                      updateMessage(blocksWithLoading, streamingContent);
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Error reading stream:', streamError);
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `Error: Failed to read streaming response`,
                  type: 'text',
                  hasThinkTags: false,
                  isLoading: false
                }
              : msg
          ));
        } finally {
          reader.releaseLock();
        }
      }

      // Update previous response ID for next request
      if (responseId) {
        setPreviousResponseId(responseId);
      }

    } catch (error: any) {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: `Error: ${error.message}`,
              type: 'text',
              hasThinkTags: false,
              isLoading: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      generateResponse(inputValue.trim());
      setInputValue('');
      
      // Reset textarea height
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        const maxHeight = Math.round(window.innerHeight * 0.4);
        textarea.style.height = Math.max(Math.min(textarea.scrollHeight, maxHeight), 96) + 'px';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputValue(textarea.value);
    
    // Auto-resize functionality
    const maxHeight = Math.round(window.innerHeight * 0.4);
    textarea.style.height = Math.max(Math.min(textarea.scrollHeight, maxHeight), 96) + 'px';
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Handle API Keys tab by opening the API keys modal
    if (tab === 'api-keys') {
      setApiKeysModalOpen(true);
      // Reset to previous tab since API Keys is a modal action, not a tab
      setActiveTab('responses');
    }
  };

  return (
    <>
    <Drawer>
      {/* Mobile Hamburger */}
      <DrawerTrigger asChild>
        <button className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-background/80 border border-border shadow-sm" aria-label="Open menu">
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </DrawerTrigger>

      {/* Drawer Content */}
      <DrawerContent className="h-[85vh] overflow-y-auto p-4 space-y-4">
        {/* Sidebar */}
        <PlaygroundSidebar 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="flex flex-col w-full"
        />
        {/* Configuration Panel */}
        <ConfigurationPanel
          modelProvider={modelProvider}
          setModelProvider={setModelProvider}
          modelName={modelName}
          setModelName={setModelName}
          imageModelProvider={imageModelProvider}
          setImageModelProvider={setImageModelProvider}
          imageModelName={imageModelName}
          setImageModelName={setImageModelName}
          imageProviderKey={imageProviderKey}
          setImageProviderKey={setImageProviderKey}
          apiKey={apiKey}
          setApiKey={setApiKey}
          baseUrl={baseUrl}
          setBaseUrl={setBaseUrl}
          temperature={temperature}
          setTemperature={setTemperature}
          maxTokens={maxTokens}
          setMaxTokens={setMaxTokens}
          topP={topP}
          setTopP={setTopP}
          storeLogs={storeLogs}
          setStoreLogs={setStoreLogs}
          textFormat={textFormat}
          setTextFormat={setTextFormat}
          toolChoice={toolChoice}
          setToolChoice={setToolChoice}
          instructions={instructions}
          setInstructions={setInstructions}
          promptMessages={promptMessages}
          onAddPromptMessage={handleAddPromptMessage}
          onRemovePromptMessage={handleRemovePromptMessage}
          selectedTools={selectedTools}
          onSelectedToolsChange={setSelectedTools}
          getMCPToolByLabel={getMCPToolByLabel}
          selectedVectorStore={selectedVectorStore}
          onVectorStoreSelect={handleVectorStoreSelect}
          onResetConversation={resetConversation}
          openApiKeysModal={apiKeysModalOpen}
          onApiKeysModalChange={setApiKeysModalOpen}
          jsonSchemaContent={jsonSchemaContent}
          setJsonSchemaContent={setJsonSchemaContent}
          jsonSchemaName={jsonSchemaName}
          setJsonSchemaName={setJsonSchemaName}
          className="w-full"
        />
      </DrawerContent>
    </Drawer>

    <div className="flex h-full bg-background">
      {/* Left Sidebar - 10% (desktop only) */}
      <PlaygroundSidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="hidden md:flex md:flex-col md:w-[10%] md:min-w-[160px]"
      />

      {/* Configuration Panel - 30% (desktop only) */}
      <ConfigurationPanel
        modelProvider={modelProvider}
        setModelProvider={setModelProvider}
        modelName={modelName}
        setModelName={setModelName}
        imageModelProvider={imageModelProvider}
        setImageModelProvider={setImageModelProvider}
        imageModelName={imageModelName}
        setImageModelName={setImageModelName}
        imageProviderKey={imageProviderKey}
        setImageProviderKey={setImageProviderKey}
        apiKey={apiKey}
        setApiKey={setApiKey}
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        topP={topP}
        setTopP={setTopP}
        storeLogs={storeLogs}
        setStoreLogs={setStoreLogs}
        textFormat={textFormat}
        setTextFormat={setTextFormat}
        toolChoice={toolChoice}
        setToolChoice={setToolChoice}
        instructions={instructions}
        setInstructions={setInstructions}
        promptMessages={promptMessages}
        onAddPromptMessage={handleAddPromptMessage}
        onRemovePromptMessage={handleRemovePromptMessage}
        selectedTools={selectedTools}
        onSelectedToolsChange={setSelectedTools}
        getMCPToolByLabel={getMCPToolByLabel}
        selectedVectorStore={selectedVectorStore}
        onVectorStoreSelect={handleVectorStoreSelect}
        onResetConversation={resetConversation}
        openApiKeysModal={apiKeysModalOpen}
        onApiKeysModalChange={setApiKeysModalOpen}
        jsonSchemaContent={jsonSchemaContent}
        setJsonSchemaContent={setJsonSchemaContent}
        jsonSchemaName={jsonSchemaName}
        setJsonSchemaName={setJsonSchemaName}
        className="hidden md:block md:w-[30%]"
      />

      {/* Chat Area */}
      <div className="flex-1 md:w-[60%] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-3">
          <div className="flex items-center justify-between w-full">
            {/* Action Buttons - Moved to extreme left */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetConversation}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">Reset Chat</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCodeModalOpen(true)}
                disabled={!lastRequest}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={lastRequest ? "View code snippets for last request" : "Send a message to generate code snippets"}
              >
                <Code className="w-4 h-4" />
                <span className="text-sm">View Code</span>
              </Button>
            </div>

            {/* Response ID Display - Moved to right */}
            {previousResponseId && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Response ID:</span>
                <div className="flex items-center space-x-1 bg-muted/50 rounded px-2 py-1">
                  <code className="text-xs font-mono text-foreground">
                    {previousResponseId.length > 20 
                      ? `${previousResponseId.substring(0, 20)}...` 
                      : previousResponseId
                    }
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResponseId}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title="Copy response ID"
                  >
                    {copiedResponseId ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Start a conversation...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                contentBlocks={message.contentBlocks}
                type={message.type}
                timestamp={message.timestamp}
                hasThinkTags={message.hasThinkTags}
                formatType={message.role === 'assistant' ? textFormat : 'text'}
                apiKey={apiKey}
                baseUrl={baseUrl}
                modelProvider={modelProvider}
                modelName={modelName}
                imageModelProvider={imageModelProvider}
                imageModelName={imageModelName}
                imageProviderKey={imageProviderKey}
                selectedVectorStore={selectedVectorStore}
                instructions={instructions}
                isLoading={message.isLoading}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

        {/* Input Area */}
        <div className="bg-background px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              <Textarea
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder="Chat with your prompt..."
                className="w-full min-h-[96px] max-h-[40vh] resize-none rounded-xl border border-border bg-muted/50 px-4 py-4 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-positive-trend/60 transition-all duration-200"
                disabled={isLoading}
                rows={1}
                style={{ 
                  lineHeight: '1.5',
                  paddingTop: '18px',
                  paddingBottom: '18px',
                  boxShadow: 'none !important',
                  outline: 'none !important'
                }}
              />
              <div className="absolute bottom-3 right-3">
                <Button 
                  type="submit" 
                  disabled={!inputValue.trim() || isLoading}
                  className="h-8 w-8 p-0 bg-positive-trend hover:bg-positive-trend/90 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={inputValue.trim() ? "Send message" : "Type a message to send"}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    {/* Code Snippets Modal */}
    <CodeTabs
      open={codeModalOpen}
      onOpenChange={setCodeModalOpen}
      lastRequest={lastRequest}
      baseUrl={apiUrl}
    />
    </>
  );
};

export default AiPlayground; 