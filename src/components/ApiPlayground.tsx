import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Settings, 
  Copy, 
  Download, 
  ChevronDown, 
  ChevronRight,
  Code2, 
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Plus,
  Minus,
  Trash2,
  Save,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface Tool {
  type: string;
  provider?: string;
  model?: string;
  model_provider_key?: string;
  alias?: string;
  [key: string]: any;
}

interface Message {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isEditing?: boolean;
  originalContent?: string;
}

interface ApiPlaygroundState {
  // Core parameters
  model: string;
  input: string | Message[];
  inputType: 'text' | 'messages';
  
  // Optional parameters
  stream: boolean;
  store: boolean;
  background: boolean;
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  instructions: string;
  previous_response_id: string;
  service_tier: string;
  
  // Tools
  tools: Tool[];
  tool_choice: string | object;
  parallel_tool_calls: boolean;
  
  // Text configuration
  text_format_type: string;
  json_schema_name: string;
  json_schema: string;
  json_schema_description: string;
  json_schema_strict: boolean;
  
  // Reasoning (o-series models)
  reasoning_effort: string;
  reasoning_summary: string;
  
  // Truncation
  truncation: string;
  
  // Include options
  include: string[];
  
  // Metadata
  metadata: Record<string, string>;
  
  // API Settings
  apiKey: string;
  baseUrl: string;
  modelProvider: string;
  customProviderUrl?: string;
}

const ApiPlayground: React.FC = () => {
  const [state, setState] = useState<ApiPlaygroundState>({
    model: 'gpt-4o',
    input: '',
    inputType: 'text',
    stream: false,
    store: true,
    background: false,
    temperature: 1.0,
    top_p: 0.9,
    max_output_tokens: 2048,
    instructions: '',
    previous_response_id: '',
    service_tier: 'auto',
    tools: [],
    tool_choice: 'auto',
    parallel_tool_calls: true,
    text_format_type: 'text',
    json_schema_name: '',
    json_schema: '{}',
    json_schema_description: '',
    json_schema_strict: false,
    reasoning_effort: 'medium',
    reasoning_summary: 'auto',
    truncation: 'disabled',
    include: [],
    metadata: {},
    apiKey: '',
    baseUrl: 'http://localhost:8080',
    modelProvider: 'openai'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [presetName, setPresetName] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', content: '' }
  ]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentMessageRole, setCurrentMessageRole] = useState<'user' | 'system'>('user');
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');
  const [activeConfigPanel, setActiveConfigPanel] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'system': true,
    'temperature': true
  });
  const [streamingEvents, setStreamingEvents] = useState<any[]>([]);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('imageGen_apiKey') || '';
    const savedBaseUrl = localStorage.getItem('imageGen_baseUrl') || 'http://localhost:8080';
    const savedModelProvider = localStorage.getItem('imageGen_modelProvider') || 'openai';
    const savedPresets = localStorage.getItem('apiPlayground_presets');
    
    setState(prev => ({
      ...prev,
      apiKey: savedApiKey,
      baseUrl: savedBaseUrl,
      modelProvider: savedModelProvider
    }));

    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    } else {
      // Add default example presets
      const defaultPresets = {
        'Simple Chat': {
          model: 'gpt-4o',
          input: '',
          inputType: 'text',
          stream: false,
          store: true,
          background: false,
          temperature: 1.0,
          top_p: 0.9,
          max_output_tokens: 2048,
          instructions: '',
          previous_response_id: '',
          service_tier: 'auto',
          tools: [],
          tool_choice: 'auto',
          parallel_tool_calls: true,
          text_format_type: 'text',
          json_schema_name: '',
          json_schema: '{}',
          json_schema_description: '',
          json_schema_strict: false,
          reasoning_effort: 'medium',
          reasoning_summary: 'auto',
          truncation: 'disabled',
          include: [],
          metadata: {},
          apiKey: savedApiKey,
          baseUrl: savedBaseUrl,
          modelProvider: savedModelProvider
        },
        'Image Generation': {
          model: 'gpt-4o',
          input: 'Create a beautiful sunset over mountains',
          inputType: 'text',
          stream: false,
          store: true,
          background: false,
          temperature: 0.8,
          top_p: 0.9,
          max_output_tokens: 2048,
          instructions: '',
          previous_response_id: '',
          service_tier: 'auto',
          text_format_type: 'text',
          json_schema_name: '',
          json_schema: '{}',
          json_schema_description: '',
          json_schema_strict: false,
          reasoning_effort: 'medium',
          reasoning_summary: 'auto',
          truncation: 'disabled',
          tool_choice: 'auto',
          parallel_tool_calls: true,
          include: [],
          metadata: {},
          tools: [{
            type: 'image_generation',
            provider: 'openai',
            model: 'gpt-image-1',
            output_format: 'png',
            model_provider_key: 'YOUR_IMAGE_PROVIDER_KEY'
          }],
          apiKey: savedApiKey,
          baseUrl: savedBaseUrl,
          modelProvider: savedModelProvider
        },
        'JSON Response': {
          model: 'gpt-4o',
          input: 'Generate user profile data with name, age, and skills',
          inputType: 'text',
          stream: false,
          store: true,
          background: false,
          temperature: 0.7,
          top_p: 0.9,
          max_output_tokens: 2048,
          instructions: '',
          previous_response_id: '',
          service_tier: 'auto',
          text_format_type: 'json_schema',
          json_schema_name: 'user_profile',
          json_schema: JSON.stringify({
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
              skills: { type: 'array', items: { type: 'string' } }
            },
            required: ['name', 'age', 'skills']
          }, null, 2),
          json_schema_description: '',
          json_schema_strict: false,
          reasoning_effort: 'medium',
          reasoning_summary: 'auto',
          truncation: 'disabled',
          tool_choice: 'auto',
          parallel_tool_calls: true,
          include: [],
          metadata: {},
          tools: [],
          apiKey: savedApiKey,
          baseUrl: savedBaseUrl,
          modelProvider: savedModelProvider
        }
      };
      setPresets(defaultPresets);
      localStorage.setItem('apiPlayground_presets', JSON.stringify(defaultPresets));
    }
  }, []);

  const updateState = (key: keyof ApiPlaygroundState, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const addMessage = () => {
    setMessages(prev => [...prev, { role: 'user', content: '' }]);
  };

  const removeMessage = (index: number) => {
    if (messages.length > 1) {
      setMessages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateMessage = (index: number, field: 'role' | 'content', value: string) => {
    setMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, [field]: value } : msg
    ));
  };

  const addTool = (toolType: string) => {
    // Check if tool type already exists (except for file_search and agentic_search)
    const allowMultiple = ['file_search', 'agentic_search'];
    const existingTool = state.tools.find(tool => tool.type === toolType);
    
    if (!allowMultiple.includes(toolType) && existingTool) {
      toast.error(`Only one ${toolType} tool is allowed. Remove the existing one first.`);
      return;
    }
    
    const newTool: Tool = { type: toolType };
    
    // Add default configurations for specific tools
    switch (toolType) {
      case 'file_search':
        newTool.vector_store_ids = [''];
        newTool.max_num_results = 5;
        // Generate default alias for multiple instances
        const fileSearchCount = state.tools.filter(t => t.type === 'file_search').length;
        newTool.alias = fileSearchCount > 0 ? `file_search_${fileSearchCount + 1}` : '';
        break;
      case 'image_generation':
        newTool.provider = 'openai';
        newTool.model = 'gpt-image-1';
        newTool.output_format = 'png';
        newTool.model_provider_key = 'YOUR_IMAGE_PROVIDER_KEY';
        break;
      case 'agentic_search':
        newTool.vector_store_ids = [''];
        newTool.max_num_results = 5;
        // Generate default alias for multiple instances
        const agenticSearchCount = state.tools.filter(t => t.type === 'agentic_search').length;
        newTool.alias = agenticSearchCount > 0 ? `agentic_search_${agenticSearchCount + 1}` : '';
        break;
      case 'code_interpreter':
        newTool.container = '';
        break;
      case 'function':
        newTool.name = '';
        newTool.description = '';
        newTool.parameters = {};
        break;
    }
    
    setState(prev => ({
      ...prev,
      tools: [...prev.tools, newTool]
    }));
    
    toast.success(`${toolType} tool added successfully!`);
  };

  const removeTool = (index: number) => {
    setState(prev => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index)
    }));
  };

  const updateTool = (index: number, field: string, value: any) => {
    // Validate alias uniqueness for file_search and agentic_search
    if (field === 'alias') {
      const tool = state.tools[index];
      const allowMultiple = ['file_search', 'agentic_search'];
      
      if (allowMultiple.includes(tool.type) && value.trim()) {
        const existingAlias = state.tools.find((t, i) => 
          i !== index && 
          t.type === tool.type && 
          t.alias === value.trim()
        );
        
        if (existingAlias) {
          toast.error(`Alias "${value}" already exists for ${tool.type}. Please use a unique alias.`);
          return;
        }
      }
    }
    
    setState(prev => ({
      ...prev,
      tools: prev.tools.map((tool, i) => 
        i === index ? { ...tool, [field]: value } : tool
      )
    }));
  };

  const buildRequestBody = (customChatHistory?: ChatMessage[]) => {
    // Use custom chat history if provided, otherwise use current chat history, otherwise fall back to input/messages
    const historyToUse = customChatHistory || chatHistory;
    let inputData;
    if (historyToUse.length > 0) {
      // Send full chat history as messages
      inputData = historyToUse.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Prepend system instructions as first message if they exist and no previous_response_id
      if (state.instructions && state.instructions.trim() && !state.previous_response_id) {
        inputData.unshift({
          role: 'system',
          content: state.instructions.trim()
        });
      }
    } else {
      // Fall back to original input logic
      inputData = state.inputType === 'text' ? state.input : messages;
    }

    const body: any = {
      model: state.modelProvider === 'custom' && state.customProviderUrl 
        ? `${state.customProviderUrl}@${state.model}`
        : `${state.modelProvider}@${state.model}`,
      input: inputData,
      stream: state.stream,
      store: state.store
    };

    // Add optional parameters only if they differ from defaults
    if (state.background) body.background = true;
    if (state.temperature !== 1.0) body.temperature = state.temperature;
    if (state.top_p !== 0.9) body.top_p = state.top_p;
    if (state.max_output_tokens !== 2048) body.max_output_tokens = state.max_output_tokens;
    
    // Instructions are now included as system messages in the input array above
    // Only include as separate field when using non-chat input modes
    if (state.instructions && state.instructions.trim() && !state.previous_response_id && 
        (customChatHistory || chatHistory).length === 0) {
      body.instructions = state.instructions;
    }
    
    if (state.previous_response_id) body.previous_response_id = state.previous_response_id;
    if (state.truncation !== 'disabled') body.truncation = state.truncation;
    if (!state.parallel_tool_calls) body.parallel_tool_calls = false;

    // Add tools if any - format model as provider@model for image generation
    if (state.tools.length > 0) {
      body.tools = state.tools.map(tool => {
        // Create a new tool object to avoid modifying the original
        const formattedTool = { ...tool };
        
        // Format image generation tool
        if (tool.type === 'image_generation' && tool.model && tool.provider) {
          // Important: Keep the provider field separate in the request
          const modelString = `${tool.provider}@${tool.model}`;
          console.log('Image generation tool model formatted as:', modelString);
          toast.success(`Using image model: ${modelString}`, { duration: 2000, id: 'image-model' });
          
          // Set model with provider@model format
          formattedTool.model = modelString;
          
          // Keep the provider field
          formattedTool.provider = tool.provider;
          
          // Always include model_provider_key for image generation (required field)
          formattedTool.model_provider_key = tool.model_provider_key || '';
        }
        
        // Include alias if it exists and is not empty (only for file_search and agentic_search)
        if ((tool.type === 'file_search' || tool.type === 'agentic_search') && 
            tool.alias && tool.alias.trim()) {
          formattedTool.alias = tool.alias.trim();
        }
        
        return formattedTool;
      });
      
      // Log the final tools array for debugging
      console.log('Final formatted tools:', JSON.stringify(body.tools, null, 2));
      
      // Add tool_choice if not auto
      if (state.tool_choice !== 'auto') body.tool_choice = state.tool_choice;
    }

    // Add text configuration only if not default or empty
    if (state.text_format_type && state.text_format_type !== 'text') {
      console.log(`Adding text format: ${state.text_format_type}`);
      body.text = { format: {} };
      if (state.text_format_type === 'json_schema') {
        body.text.format = {
          type: 'json_schema',
          name: state.json_schema_name,
          schema: JSON.parse(state.json_schema || '{}'),
          description: state.json_schema_description,
          strict: state.json_schema_strict
        };
      } else if (state.text_format_type === 'json_object') {
        body.text.format = { type: 'json_object' };
      }
    } else {
      console.log(`Skipping text format: ${state.text_format_type || 'empty'}`);
    }

    // Add reasoning for o-series models
    if (state.model.startsWith('o1') || state.model.startsWith('o3')) {
      body.reasoning = {
        effort: state.reasoning_effort,
        summary: state.reasoning_summary
      };
    }

    // Add include options (ensure it's an array)
    if (state.include && Array.isArray(state.include) && state.include.length > 0) {
      body.include = state.include;
    }

    // Add metadata
    if (Object.keys(state.metadata || {}).length > 0) {
      body.metadata = state.metadata;
    }

    return body;
  };

  const executeRequest = async (customChatHistory?: ChatMessage[]) => {
    if (!state.apiKey.trim()) {
      toast.error('Please set your API key');
      return;
    }

    // Validate image generation tools have required model_provider_key
    const imageGenTools = state.tools.filter(tool => tool.type === 'image_generation');
    for (const tool of imageGenTools) {
      if (!tool.model_provider_key?.trim()) {
        toast.error(`Image generation tool requires a provider API key. Please configure the "Image Provider Key" field.`);
        return;
      }
    }

    // Validate file_search and agentic_search tools have unique aliases when multiple exist
    const fileSearchTools = state.tools.filter(tool => tool.type === 'file_search');
    const agenticSearchTools = state.tools.filter(tool => tool.type === 'agentic_search');
    
    if (fileSearchTools.length > 1) {
      const aliases = fileSearchTools.map(tool => tool.alias?.trim()).filter(Boolean);
      const uniqueAliases = new Set(aliases);
      
      if (aliases.length !== fileSearchTools.length || aliases.length !== uniqueAliases.size) {
        toast.error(`Multiple file_search tools require unique aliases. Please ensure all file_search tools have unique alias values.`);
        return;
      }
    }
    
    if (agenticSearchTools.length > 1) {
      const aliases = agenticSearchTools.map(tool => tool.alias?.trim()).filter(Boolean);
      const uniqueAliases = new Set(aliases);
      
      if (aliases.length !== agenticSearchTools.length || aliases.length !== uniqueAliases.size) {
        toast.error(`Multiple agentic_search tools require unique aliases. Please ensure all agentic_search tools have unique alias values.`);
        return;
      }
    }

    setIsLoading(true);
    setIsStreaming(true);
    setResponse(null);
    setStreamingEvents([]); // Clear previous events
    const startTime = Date.now();



    // Create placeholder assistant message for streaming (only if streaming is enabled)
    let assistantMessage: ChatMessage | null = null;
    let assistantMessageId: string | null = null;
    if (state.stream) {
      assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      // Add a copy to avoid reference issues
      setChatHistory(prev => [...prev, { ...assistantMessage }]);
    }

    try {
      const requestBody = buildRequestBody(customChatHistory);
      
      const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}`,
        ...(state.modelProvider !== 'openai' && { 'x-model-provider': state.modelProvider })
      };

      // Add Accept header for streaming
      if (state.stream) {
        headers['Accept'] = 'text/event-stream';
      }

      const response = await fetch(`${state.baseUrl}/v1/responses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      let responseData;
      if (state.stream) {
        // Handle streaming response
        if (!response.body) {
          throw new Error('No response body received');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentResponseId = '';
        let assistantContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              if (trimmedLine.startsWith('data: ')) {
                try {
                  const eventDataStr = trimmedLine.substring(6).trim();
                  
                  if (eventDataStr === '[DONE]') {
                    break;
                  }

                  const eventData = JSON.parse(eventDataStr);
                  
                  // Add event to streaming events list
                  setStreamingEvents(prev => [...prev, {
                    ...eventData,
                    timestamp: new Date().toISOString(),
                    id: Math.random().toString(36).substr(2, 9)
                  }]);

                  switch (eventData.type) {
                    case 'response.created':
                      currentResponseId = eventData.response?.id;
                      toast.info('Response created, starting processing...');
                      break;

                    case 'response.in_progress':
                      toast.info('Processing your request...');
                      break;

                    case 'response.output_text.delta':
                      // Stream each delta directly by appending to existing content
                      assistantContent += eventData.delta;
                      if (assistantMessage && assistantMessage.timestamp) {
                        setChatHistory(prev => prev.map((msg, index) => {
                          // Find the last assistant message that matches our timestamp
                          if (msg.role === 'assistant' && 
                              msg.timestamp === assistantMessage.timestamp &&
                              index === prev.length - 1) {
                            return { ...msg, content: assistantContent };
                          }
                          return msg;
                        }));
                      }
                      break;

                    case 'response.output_text.done':
                      // Use the complete text from the done event
                      assistantContent = eventData.text;
                      if (assistantMessage && assistantMessage.timestamp) {
                        setChatHistory(prev => prev.map((msg, index) => {
                          // Find the last assistant message that matches our timestamp
                          if (msg.role === 'assistant' && 
                              msg.timestamp === assistantMessage.timestamp &&
                              index === prev.length - 1) {
                            return { ...msg, content: assistantContent };
                          }
                          return msg;
                        }));
                      }
                      break;

                    case 'response.image_generation.in_progress':
                      toast.info('Generating image...');
                      break;

                    case 'response.image_generation.completed':
                      toast.success('Image generated successfully!');
                      break;

                    case 'response.file_search.in_progress':
                      toast.info('Searching documents...');
                      break;

                    case 'response.file_search.completed':
                      toast.success('Document search completed!');
                      break;

                    case 'response.agentic_search.in_progress':
                      toast.info('Performing agentic search...');
                      break;

                    case 'response.agentic_search.completed':
                      toast.success('Agentic search completed!');
                      break;

                    case 'response.completed':
                      if (eventData.response?.output && eventData.response.output.length > 0) {
                        const output = eventData.response.output[0];
                        
                        // Check for new format with result field
                        if (output.result) {
                          assistantContent = output.result;
                          if (assistantMessage && assistantMessage.timestamp) {
                            setChatHistory(prev => prev.map((msg, index) => {
                              // Find the last assistant message that matches our timestamp
                              if (msg.role === 'assistant' && 
                                  msg.timestamp === assistantMessage.timestamp &&
                                  index === prev.length - 1) {
                                return { ...msg, content: assistantContent };
                              }
                              return msg;
                            }));
                          }
                        }
                      }
                      
                      setResponse(eventData.response);
                      toast.success('Request completed successfully!');
                      break;

                    default:
                      break;
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError, 'Original line:', trimmedLine);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Handle non-streaming response
        responseData = await response.json();
        setResponse(responseData);
        
        // Extract response text and add to chat history
        let assistantContent = '';
        if (responseData.output && responseData.output.length > 0) {
          const output = responseData.output[0];
          if (output.result) {
            assistantContent = output.result;
          } else if (output.content && output.content.length > 0) {
            assistantContent = output.content[0].text || '';
          }
        }
        
        if (assistantContent) {
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date().toISOString()
          }]);
        }
        
        toast.success('Request completed successfully!');
      }

    } catch (error: any) {
      console.error('API Error:', error);
      const errorMessage = `Error: ${error.message}`;
      
      // Add error message to chat history
      if (state.stream && assistantMessage && assistantMessage.timestamp) {
        // Update the placeholder assistant message with error
        setChatHistory(prev => prev.map((msg, index) => {
          // Find the last assistant message that matches our timestamp
          if (msg.role === 'assistant' && 
              msg.timestamp === assistantMessage.timestamp &&
              index === prev.length - 1) {
            return { ...msg, content: errorMessage };
          }
          return msg;
        }));
      } else {
        // Add new error message for non-streaming
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date().toISOString()
        }]);
      }
      
      setResponse({
        error: true,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`Request failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const copyRequestBody = () => {
    const requestBody = buildRequestBody();
    navigator.clipboard.writeText(JSON.stringify(requestBody, null, 2));
    toast.success('Request body copied to clipboard!');
  };

  const showCurlCommand = () => {
    const requestBody = buildRequestBody();
    const headers = [
      "Content-Type: application/json",
      `Authorization: Bearer ${state.apiKey}`
    ];
    
    if (state.modelProvider !== 'openai') {
      headers.push(`x-model-provider: ${state.modelProvider}`);
    }

    const curl = `curl --location '${state.baseUrl}/v1/responses' \\
${headers.map(h => `--header '${h}'`).join(' \\\n')} \\
--data '${JSON.stringify(requestBody, null, 2).replace(/'/g, "'\"'\"'")}'`;

    setCurlCommand(curl);
    setShowCurlModal(true);
  };

  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(curlCommand);
    toast.success('cURL command copied to clipboard!');
    setShowCurlModal(false);
  };

  const downloadResponse = () => {
    if (!response) return;
    
    const dataStr = JSON.stringify(response, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `openresponses-response-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Response downloaded!');
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const presetData = {
      ...state,
      messages,
      timestamp: new Date().toISOString()
    };

    const newPresets = {
      ...presets,
      [presetName]: presetData
    };

    setPresets(newPresets);
    localStorage.setItem('apiPlayground_presets', JSON.stringify(newPresets));
    setPresetName('');
    toast.success(`Preset "${presetName}" saved!`);
  };

  const loadPreset = (name: string) => {
    const preset = presets[name];
    if (!preset) return;

    // Merge preset with current state to preserve default values for missing fields
    setState(prev => ({
      ...prev,
      ...preset,
      // Ensure default values are preserved if not in preset
      top_p: preset.top_p ?? 0.9,
      max_output_tokens: preset.max_output_tokens ?? 2048,
      temperature: preset.temperature ?? 1.0,
      stream: preset.stream ?? false,
      store: preset.store ?? true,
      background: preset.background ?? false,
      parallel_tool_calls: preset.parallel_tool_calls ?? true,
      text_format_type: preset.text_format_type ?? 'text',
      json_schema_strict: preset.json_schema_strict ?? false,
      reasoning_effort: preset.reasoning_effort ?? 'medium',
      reasoning_summary: preset.reasoning_summary ?? 'auto',
      truncation: preset.truncation ?? 'disabled',
      tool_choice: preset.tool_choice ?? 'auto',
      include: preset.include ?? [],
      metadata: preset.metadata ?? {},
      tools: preset.tools ?? []
    }));
    if (preset.messages) {
      setMessages(preset.messages);
    }
    toast.success(`Preset "${name}" loaded!`);
  };

  const deletePreset = (name: string) => {
    const newPresets = { ...presets };
    delete newPresets[name];
    setPresets(newPresets);
    localStorage.setItem('apiPlayground_presets', JSON.stringify(newPresets));
    toast.success(`Preset "${name}" deleted!`);
  };

  const clearAll = () => {
    setState(prev => ({
      ...prev,
      input: '',
      instructions: '',
      previous_response_id: '',
      tools: [],
      metadata: {}
    }));
    setMessages([{ role: 'user', content: '' }]);
    setResponse(null);
    toast.success('Cleared all inputs');
  };

  // Chat history management functions
  const addChatMessage = () => {
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: '',
      timestamp: new Date().toISOString(),
      isEditing: true
    }]);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setResponse(null);
    toast.success('Chat history cleared');
  };

  const editChatMessage = (index: number) => {
    setChatHistory(prev => prev.map((msg, i) => 
      i === index ? { 
        ...msg, 
        isEditing: true, 
        originalContent: msg.content 
      } : msg
    ));
  };

  const removeChatMessage = (index: number) => {
    setChatHistory(prev => prev.filter((_, i) => i !== index));
    toast.success('Message removed');
  };

  const updateChatMessage = (index: number, field: 'role' | 'content', value: string) => {
    setChatHistory(prev => prev.map((msg, i) => 
      i === index ? { ...msg, [field]: value } : msg
    ));
  };

  const saveChatMessage = (index: number) => {
    setChatHistory(prev => prev.map((msg, i) => 
      i === index ? { 
        ...msg, 
        isEditing: false, 
        originalContent: undefined,
        timestamp: new Date().toISOString()
      } : msg
    ));
    toast.success('Message saved');
  };

  const cancelEditChatMessage = (index: number) => {
    setChatHistory(prev => prev.map((msg, i) => 
      i === index ? { 
        ...msg, 
        isEditing: false, 
        content: msg.originalContent || msg.content,
        originalContent: undefined
      } : msg
    ));
  };

  // Chat input functions
  const sendChatMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Create the new message
    const newMessage = {
      role: currentMessageRole,
      content: currentMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Add message to chat history
    setChatHistory(prev => [...prev, newMessage]);
    
    setCurrentMessage('');
    
    // If it's a user message, automatically execute the API request
    if (currentMessageRole === 'user') {
      // Execute request immediately with the updated chat history
      // We need to pass the updated chat history since state might not have updated yet
      executeRequest([...chatHistory, newMessage]);
    } else {
      toast.success('System message added to chat');
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const openConfigPanel = (panel: string) => {
    setActiveConfigPanel(panel);
  };

  const closeConfigPanel = () => {
    setActiveConfigPanel(null);
  };

  // Image rendering functions (adapted from ChatMessage component)
  const isImageContent = (content: string): boolean => {
    const cleanContent = content.replace(/^data:image\/[^;]+;base64,/, '').trim();
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const isValidBase64 = base64Regex.test(cleanContent);
    
    const hasImageSignature = 
      cleanContent.startsWith('/9j/') ||     // JPEG
      cleanContent.startsWith('FFD8') ||     // JPEG hex
      cleanContent.startsWith('/9j') ||      // JPEG variant
      cleanContent.startsWith('iVBORw0KGgo') || // PNG
      cleanContent.startsWith('89504E47') ||    // PNG hex
      cleanContent.startsWith('iVBORw') ||      // PNG variant
      cleanContent.startsWith('UklGR') ||       // WebP (RIFF)
      cleanContent.startsWith('UklGRg') ||      // WebP variant
      cleanContent.startsWith('R0lGODlh') ||    // GIF
      cleanContent.startsWith('R0lGODdh') ||    // GIF variant
      cleanContent.startsWith('R0lGOD');        // GIF variant

    return isValidBase64 && hasImageSignature && cleanContent.length > 100;
  };

  const validateAndCleanBase64 = (base64Content: string): { isValid: boolean; cleanBase64: string; issues: string[] } => {
    const issues: string[] = [];
    let cleanBase64 = base64Content.replace(/^data:image\/[^;]+;base64,/, '');
    
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    
    const paddingNeeded = cleanBase64.length % 4;
    if (paddingNeeded > 0) {
      const padding = '='.repeat(4 - paddingNeeded);
      cleanBase64 += padding;
      issues.push(`Added ${4 - paddingNeeded} padding characters`);
    }
    
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const isValidBase64 = base64Regex.test(cleanBase64);
    
    if (!isValidBase64) {
      issues.push('Contains invalid base64 characters');
    }
    
    if (cleanBase64.length < 100) {
      issues.push('Base64 data too short for valid image');
    }
    
    return {
      isValid: isValidBase64 && issues.length <= 1,
      cleanBase64,
      issues
    };
  };

  const detectImageFormat = (base64Content: string): string => {
    const cleanContent = base64Content.replace(/^data:image\/[^;]+;base64,/, '').trim();
    
    if (cleanContent.startsWith('/9j/') || cleanContent.startsWith('/9j') || cleanContent.startsWith('FFD8')) {
      return 'jpeg';
    } else if (cleanContent.startsWith('iVBORw0KGgo') || cleanContent.startsWith('iVBORw') || cleanContent.startsWith('89504E47')) {
      return 'png';
    } else if (cleanContent.startsWith('UklGR') || cleanContent.startsWith('UklGRg')) {
      return 'webp';
    } else if (cleanContent.startsWith('R0lGODlh') || cleanContent.startsWith('R0lGODdh') || cleanContent.startsWith('R0lGOD')) {
      return 'gif';
    }
    
    return 'png';
  };

  const renderMessageContent = (content: string) => {
    // Check if this is a text message that contains <image> tags
    if (content.includes('<image>')) {
      const parts = content.split(/<image>|<\/image>/);
      const elements = [];
      
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          // Text part
          if (parts[i].trim()) {
            elements.push(
              <div key={i} className="mb-4 whitespace-pre-wrap text-sm leading-relaxed break-words">
                {parts[i]}
              </div>
            );
          }
        } else {
          // Image part
          const imageData = parts[i].trim();
          if (imageData && isImageContent(imageData)) {
            const validation = validateAndCleanBase64(imageData);
            const imageFormat = detectImageFormat(imageData);
            const dataUrl = validation.cleanBase64.startsWith('data:') 
              ? validation.cleanBase64 
              : `data:image/${imageFormat};base64,${validation.cleanBase64}`;
            
            elements.push(
              <div key={i} className="mb-6">
                <div className="relative inline-block bg-muted p-2 rounded-lg shadow-sm">
                  <img 
                    src={dataUrl}
                    alt="Generated"
                    className="max-w-full h-auto rounded-md shadow-sm"
                    style={{ maxHeight: '512px' }}
                    onError={(e) => {
                      console.error('Image failed to load');
                      console.log('Validation issues:', validation.issues);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {validation.issues.length > 0 && (
                    <div className="mt-2 text-xs text-warning dark:text-warning-light">
                      Issues: {validation.issues.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        }
      }
      
      return <div className="space-y-4">{elements}</div>;
    }
    
    // Check if the entire content is an image
    if (isImageContent(content)) {
      const validation = validateAndCleanBase64(content);
      
      if (!validation.isValid) {
        return (
          <div className="p-4 bg-error/5 dark:bg-error/10 border border-error/20 dark:border-error/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="h-4 w-4 text-error" />
              <span className="text-sm font-medium text-error">Image Error</span>
            </div>
            <p className="text-sm text-error-dark dark:text-error-light">Invalid image data detected.</p>
            {validation.issues.length > 0 && (
              <ul className="mt-2 text-xs text-error-dark dark:text-error-light">
                {validation.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            )}
          </div>
        );
      }
      
      const imageFormat = detectImageFormat(content);
      const dataUrl = validation.cleanBase64.startsWith('data:') 
        ? validation.cleanBase64 
        : `data:image/${imageFormat};base64,${validation.cleanBase64}`;
      
      return (
        <div className="relative inline-block bg-muted p-2 rounded-lg shadow-sm">
          <img 
            src={dataUrl}
            alt="Generated"
            className="max-w-full h-auto rounded-md shadow-sm"
            style={{ maxHeight: '512px' }}
            onError={(e) => {
              console.error('Image failed to load');
              console.log('Validation issues:', validation.issues);
              e.currentTarget.style.display = 'none';
            }}
          />
          {validation.issues.length > 0 && (
            <div className="mt-2 text-xs text-warning dark:text-warning-light">
              Issues: {validation.issues.join(', ')}
            </div>
          )}
        </div>
      );
    }

    // Default text rendering
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
        {content}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-background relative">
        {/* Left Panel - Main Configuration - Redesigned with Geist UI */}
        <div className="w-[380px] bg-card border-r border-border flex flex-col shadow-xs">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-muted">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center shadow-xs">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Configuration</h2>
                <p className="text-xs text-muted-foreground">API Playground Settings</p>
              </div>
            </div>
          </div>

          {/* Preset Management */}
          <div className="px-6 py-5 border-b border-border bg-muted/50">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                                  <Save className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold text-foreground">Presets</Label>
              </div>
              {Object.keys(presets).length > 0 && (
                <Select onValueChange={loadPreset}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Load a preset..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {Object.keys(presets).map((name) => (
                      <SelectItem key={name} value={name} className="text-foreground hover:bg-accent">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex space-x-2">
                                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Enter preset name..."
                    className="flex-1 h-10"
                  />
                <Button variant="outline" size="sm" onClick={savePreset} className="px-4 border-border text-foreground hover:bg-accent">
                  <Save className="h-3 w-3 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-6 py-6 space-y-8">
              {/* API Configuration */}
              <div className="space-y-4">
                <button
                  onClick={() => openConfigPanel('api')}
                  className="flex items-center justify-between w-full text-left group hover:bg-primary/5 dark:hover:bg-primary/10 p-4 rounded-lg transition-colors duration-200 border border-transparent hover:border-primary/20 dark:hover:border-primary/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div>
                      <Label className="text-base font-semibold text-foreground group-hover:text-primary dark:group-hover:text-primary-light transition-colors">API & Model Configuration</Label>
                      <p className="text-xs text-muted-foreground">Endpoint, authentication & model settings</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {state.apiKey && (
                      <span className="px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-xs font-medium rounded border border-primary/20 dark:border-primary/30">
                        Configured
                      </span>
                    )}
                    <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary dark:group-hover:text-primary-light transition-colors" />
                  </div>
                </button>
                
                {/* Quick Model Selection */}
                <div className="ml-6 space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">Model</Label>
                    <Input
                      value={state.model}
                      onChange={(e) => updateState('model', e.target.value)}
                      placeholder="gpt-4o, claude-3-5-sonnet-20241022, gemini-1.5-pro..."
                      className="h-10 font-mono hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Enter any model name (provider will be auto-detected)</p>
                  </div>
                </div>
              </div>

              {/* System Instructions */}
              <div className="space-y-4">
                <button
                  onClick={() => openConfigPanel('system')}
                  className="flex items-center justify-between w-full text-left group hover:bg-success/5 dark:hover:bg-success/10 p-4 rounded-lg transition-colors duration-200 border border-transparent hover:border-success/20 dark:hover:border-success/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <div>
                      <Label className="text-base font-semibold text-foreground group-hover:text-success dark:group-hover:text-success-light transition-colors">System Instructions</Label>
                      <p className="text-xs text-muted-foreground">Define AI behavior and personality</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {state.instructions && (
                      <span className="px-2 py-1 bg-success/10 dark:bg-success/20 text-success dark:text-success-light text-xs font-medium rounded border border-success/20 dark:border-success/30">
                        Configured
                      </span>
                    )}
                    <Settings className="h-4 w-4 text-muted-foreground group-hover:text-success dark:group-hover:text-success-light transition-colors" />
                  </div>
                </button>
              </div>

              {/* Temperature */}
              <div className="space-y-4">
                <button
                  onClick={() => toggleSection('temperature')}
                  className="flex items-center justify-between w-full text-left group hover:bg-warning/5 dark:hover:bg-warning/10 p-2 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <Label className="text-base font-semibold text-foreground group-hover:text-warning dark:group-hover:text-warning-light transition-colors">Temperature</Label>
                    <span className="px-2 py-1 bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning-light text-xs font-mono rounded border border-warning/20 dark:border-warning/30">
                      {state.temperature}
                    </span>
                  </div>
                                     {expandedSections.temperature ? 
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-warning dark:group-hover:text-warning-light transition-colors" /> : 
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-warning dark:group-hover:text-warning-light transition-colors" />
                  }
                </button>
                {expandedSections.temperature && (
                  <div className="ml-5 space-y-4">
                    <Slider
                      value={[state.temperature]}
                      onValueChange={([value]) => updateState('temperature', value)}
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-full [&_[role=slider]]:bg-warning [&_[role=slider]]:border-warning [&_.relative]:bg-warning/20"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Focused (0)</span>
                      <span>Balanced (1)</span>
                      <span>Creative (2)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Controls randomness in responses</p>
                  </div>
                )}
              </div>



              {/* Advanced Parameters */}
              <div className="space-y-3">
                <button
                  onClick={() => openConfigPanel('advanced')}
                  className="flex items-center justify-between w-full text-left group hover:bg-error/5 dark:hover:bg-error/10 p-3 rounded-lg transition-colors border border-transparent hover:border-error/20 dark:hover:border-error/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-error rounded-full"></div>
                    <div>
                      <Label className="text-base font-semibold text-foreground group-hover:text-error dark:group-hover:text-error-light transition-colors">Advanced Parameters</Label>
                      <p className="text-xs text-muted-foreground">Fine-tune model behavior</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {state.stream && (
                        <Badge variant="outline" className="text-xs bg-error/10 dark:bg-error/20 text-error dark:text-error-light border-error/20 dark:border-error/30">
                          Stream
                        </Badge>
                      )}
                      {state.top_p !== 0.9 && (
                        <Badge variant="outline" className="text-xs bg-error/10 dark:bg-error/20 text-error dark:text-error-light border-error/20 dark:border-error/30">
                          Top-P: {state.top_p}
                        </Badge>
                      )}
                      {state.max_output_tokens !== 2048 && (
                        <Badge variant="outline" className="text-xs bg-error/10 dark:bg-error/20 text-error dark:text-error-light border-error/20 dark:border-error/30">
                          Max: {state.max_output_tokens}
                        </Badge>
                      )}
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground group-hover:text-error dark:group-hover:text-error-light transition-colors" />
                  </div>
                </button>
              </div>

              {/* Tools */}
              <div className="space-y-3">
                <button
                  onClick={() => openConfigPanel('tools')}
                  className="flex items-center justify-between w-full text-left group hover:bg-success/5 dark:hover:bg-success/10 p-3 rounded-lg transition-colors border border-transparent hover:border-success/20 dark:hover:border-success/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <div>
                      <Label className="text-base font-semibold text-foreground group-hover:text-success dark:group-hover:text-success-light transition-colors">Tools</Label>
                      <p className="text-xs text-muted-foreground">Extend AI capabilities</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs bg-success/10 dark:bg-success/20 text-success dark:text-success-light border-success/20 dark:border-success/30">
                      {state.tools.length} {state.tools.length === 1 ? 'tool' : 'tools'}
                    </Badge>
                    <Settings className="h-4 w-4 text-muted-foreground group-hover:text-success dark:group-hover:text-success-light transition-colors" />
                  </div>
                </button>
                
                {/* Quick Add Tools */}
                <div className="ml-6 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => addTool('file_search')} className="h-8 text-xs border-border text-foreground hover:bg-success/5 dark:hover:bg-success/10 hover:border-success/30 dark:hover:border-success/40">
                    + File Search
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTool('image_generation')} className="h-8 text-xs border-border text-foreground hover:bg-success/5 dark:hover:bg-success/10 hover:border-success/30 dark:hover:border-success/40">
                    + Image Gen
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTool('agentic_search')} className="h-8 text-xs border-border text-foreground hover:bg-success/5 dark:hover:bg-success/10 hover:border-success/30 dark:hover:border-success/40">
                    + Agentic Search
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTool('function')} className="h-8 text-xs border-border text-foreground hover:bg-success/5 dark:hover:bg-success/10 hover:border-success/30 dark:hover:border-success/40">
                    + Function
                  </Button>
                </div>
              </div>

              {/* Output Format */}
              <div className="space-y-3">
                <button
                  onClick={() => openConfigPanel('output')}
                  className="flex items-center justify-between w-full text-left group hover:bg-primary/5 dark:hover:bg-primary/10 p-3 rounded-lg transition-colors border border-transparent hover:border-primary/20 dark:hover:border-primary/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div>
                      <Label className="text-base font-semibold text-foreground group-hover:text-primary dark:group-hover:text-primary-light transition-colors">Output Format</Label>
                      <p className="text-xs text-muted-foreground">Control response structure</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light border-primary/20 dark:border-primary/30">
                      {state.text_format_type === 'text' ? 'Text' : 
                       state.text_format_type === 'json_object' ? 'JSON' : 'Schema'}
                    </Badge>
                    <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary dark:group-hover:text-primary-light transition-colors" />
                  </div>
                </button>
                
                {/* Quick Format Selection */}
                <div className="ml-6 space-y-2">
                                      <Select value={state.text_format_type} onValueChange={(value) => updateState('text_format_type', value)}>
                      <SelectTrigger className="h-9 hover:border-primary/50 dark:hover:border-primary/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
                      <SelectItem value="text" className="text-foreground hover:bg-accent">Plain Text</SelectItem>
                      <SelectItem value="json_object" className="text-foreground hover:bg-accent">JSON Object</SelectItem>
                      <SelectItem value="json_schema" className="text-foreground hover:bg-accent">JSON Schema</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {state.text_format_type === 'json_schema' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfigPanel('json-schema')}
                      className="w-full h-8 text-xs bg-card border-border text-foreground hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 dark:hover:border-primary/40"
                    >
                      <Code2 className="h-3 w-3 mr-1" />
                      Edit JSON Schema
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Secondary Configuration Panel */}
        {activeConfigPanel && (
          <div className="w-[500px] bg-card border-r border-border shadow-lg flex flex-col">
            {/* Secondary Panel Header */}
            <div className="px-6 py-4 border-b border-border bg-muted">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-success rounded-md flex items-center justify-center">
                    <Settings className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground capitalize">
                      {activeConfigPanel === 'json-schema' ? 'JSON Schema Editor' : `${activeConfigPanel} Configuration`}
                    </h3>
                    <p className="text-xs text-muted-foreground">Advanced settings and detailed configuration</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeConfigPanel}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-accent"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Secondary Panel Content */}
            <ScrollArea className="flex-1">
              <div className="px-6 py-6 max-w-full">
                {activeConfigPanel === 'system' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-foreground mb-3 block">System Instructions</Label>
                      <Textarea
                        value={state.instructions}
                        onChange={(e) => updateState('instructions', e.target.value)}
                        placeholder="You are a helpful assistant. You can define the AI's personality, behavior, and capabilities here. Be specific about how the AI should respond, what tone to use, and any special instructions for handling different types of requests."
                        className="min-h-[200px] text-sm resize-none focus:border-success dark:focus:border-success-light focus:ring-1 focus:ring-success/20 dark:focus:ring-success/30"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        System instructions define the AI's role and behavior. These instructions are always active and influence all responses.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-base font-semibold text-foreground">Quick Templates</Label>
                      <div className="grid gap-3">
                        {[
                          {
                            name: "Professional Assistant",
                            content: "You are a professional AI assistant. Provide clear, accurate, and helpful responses. Maintain a formal but friendly tone. Always ask clarifying questions when needed."
                          },
                          {
                            name: "Creative Writer",
                            content: "You are a creative writing assistant. Help users with storytelling, character development, and creative expression. Be imaginative and inspiring while providing constructive feedback."
                          },
                          {
                            name: "Technical Expert",
                            content: "You are a technical expert assistant. Provide detailed, accurate technical information. Include code examples when relevant and explain complex concepts clearly."
                          },
                          {
                            name: "Casual Friend",
                            content: "You are a friendly, casual AI companion. Use a relaxed, conversational tone. Be supportive and encouraging while maintaining helpfulness."
                          }
                        ].map((template) => (
                          <Button
                            key={template.name}
                            variant="outline"
                            className="h-auto p-3 text-left justify-start bg-card border-border text-foreground hover:bg-success/5 dark:hover:bg-success/10 hover:border-success/30 dark:hover:border-success/40 transition-colors"
                            onClick={() => updateState('instructions', template.content)}
                          >
                            <div className="w-full">
                              <div className="font-medium text-sm text-foreground mb-2">{template.name}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed whitespace-normal">
                                {template.content}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeConfigPanel === 'json-schema' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-foreground mb-3 block">JSON Schema Editor</Label>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-2 block">Schema Name</Label>
                          <Input
                            value={state.json_schema_name}
                            onChange={(e) => updateState('json_schema_name', e.target.value)}
                            placeholder="response_schema"
                            className="h-10 focus:border-primary dark:focus:border-primary-light focus:ring-1 focus:ring-primary/20 dark:focus:ring-primary/30"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-2 block">Description</Label>
                          <Input
                            value={state.json_schema_description}
                            onChange={(e) => updateState('json_schema_description', e.target.value)}
                            placeholder="Describe what this schema represents..."
                            className="h-10 focus:border-primary dark:focus:border-primary-light focus:ring-1 focus:ring-primary/20 dark:focus:ring-primary/30"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={state.json_schema_strict} 
                            onCheckedChange={(checked) => updateState('json_schema_strict', checked)} 
                          />
                          <Label className="text-sm font-medium">Strict Mode</Label>
                          <Badge variant="outline" className="text-xs">
                            {state.json_schema_strict ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-foreground mb-2 block">JSON Schema</Label>
                          <Textarea
                            value={state.json_schema}
                            onChange={(e) => updateState('json_schema', e.target.value)}
                            placeholder='{\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string",\n      "description": "The name field"\n    },\n    "age": {\n      "type": "number",\n      "minimum": 0\n    }\n  },\n  "required": ["name"]\n}'
                            className="min-h-[300px] font-mono text-sm focus:border-primary dark:focus:border-primary-light focus:ring-1 focus:ring-primary/20 dark:focus:ring-primary/30"
                          />
                          <p className="text-sm text-muted-foreground mt-2">
                            Define the structure and validation rules for JSON responses. Use standard JSON Schema format.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold text-foreground">Schema Templates</Label>
                      <div className="grid gap-3">
                        {[
                          {
                            name: "User Profile",
                            schema: {
                              type: "object",
                              properties: {
                                name: { type: "string", description: "Full name" },
                                email: { type: "string", format: "email" },
                                age: { type: "number", minimum: 0, maximum: 150 },
                                skills: { type: "array", items: { type: "string" } }
                              },
                              required: ["name", "email"]
                            }
                          },
                          {
                            name: "Product Info",
                            schema: {
                              type: "object",
                              properties: {
                                name: { type: "string" },
                                price: { type: "number", minimum: 0 },
                                category: { type: "string" },
                                inStock: { type: "boolean" },
                                tags: { type: "array", items: { type: "string" } }
                              },
                              required: ["name", "price"]
                            }
                          },
                          {
                            name: "API Response",
                            schema: {
                              type: "object",
                              properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                                timestamp: { type: "string", format: "date-time" }
                              },
                              required: ["success"]
                            }
                          }
                        ].map((template) => (
                          <Button
                            key={template.name}
                            variant="outline"
                            className="h-auto p-3 text-left justify-start bg-card border-border text-foreground hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 dark:hover:border-primary/40 transition-colors"
                            onClick={() => updateState('json_schema', JSON.stringify(template.schema, null, 2))}
                          >
                            <div>
                              <div className="font-medium text-sm text-foreground">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">Click to use this schema template</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeConfigPanel === 'tools' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-foreground mb-3 block">Tools Configuration</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure and manage AI tools that extend the model's capabilities.
                      </p>
                    </div>

                    {state.tools.map((tool, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg bg-success/5 dark:bg-success/10">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="text-success dark:text-success-light border-success/20 dark:border-success/30">{tool.type}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTool(index)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Tool-specific configuration */}
                        {tool.type === 'image_generation' && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Provider</Label>
                              <Select 
                                value={tool.provider || 'openai'} 
                                onValueChange={(value) => updateTool(index, 'provider', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-border">
                                  <SelectItem value="openai" className="text-foreground hover:bg-accent">OpenAI</SelectItem>
                                  <SelectItem value="gemini" className="text-foreground hover:bg-accent">Gemini</SelectItem>
                                  <SelectItem value="togetherai" className="text-foreground hover:bg-accent">Together AI</SelectItem>
                                  <SelectItem value="custom" className="text-foreground hover:bg-accent">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Model</Label>
                              <Input
                                value={tool.model || ''}
                                onChange={(e) => updateTool(index, 'model', e.target.value)}
                                placeholder="e.g., gpt-image-1 (openai), imagen-3.0-generate-002 (gemini), flux-1-schnell-free (togetherai)"
                                className="h-9 font-mono"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Enter the model name for your selected provider
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">
                                Image Provider Key <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={tool.model_provider_key || ''}
                                onChange={(e) => updateTool(index, 'model_provider_key', e.target.value)}
                                placeholder="API key for the image provider (required)"
                                type="password"
                                className={`h-9 font-mono ${!tool.model_provider_key?.trim() ? 'border-red-300 focus:border-red-500' : ''}`}
                                required
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {tool.provider === 'openai' && 'OpenAI API key for image generation (required)'}
                                {tool.provider === 'gemini' && 'Google AI Studio API key for Gemini image models (required)'}
                                {tool.provider === 'togetherai' && 'Together AI API key for image models (required)'}
                                {tool.provider === 'custom' && 'API key for your custom image provider (required)'}
                                {!tool.provider && 'API key for the selected image provider (required)'}
                              </p>
                              {!tool.model_provider_key?.trim() && (
                                <p className="text-xs text-red-500 mt-1">
                                  ⚠️ Image provider key is required for image generation
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {tool.type === 'function' && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">Function Name</Label>
                              <Input
                                value={tool.name || ''}
                                onChange={(e) => updateTool(index, 'name', e.target.value)}
                                placeholder="get_weather"
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">Description</Label>
                              <Textarea
                                value={tool.description || ''}
                                onChange={(e) => updateTool(index, 'description', e.target.value)}
                                placeholder="Get current weather for a location"
                                className="min-h-[60px] text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">Parameters (JSON Schema)</Label>
                              <Textarea
                                value={typeof tool.parameters === 'string' ? tool.parameters : JSON.stringify(tool.parameters || {}, null, 2)}
                                onChange={(e) => {
                                  try {
                                    updateTool(index, 'parameters', JSON.parse(e.target.value));
                                  } catch {
                                    updateTool(index, 'parameters', e.target.value);
                                  }
                                }}
                                placeholder='{\n  "type": "object",\n  "properties": {\n    "location": {\n      "type": "string"\n    }\n  }\n}'
                                className="min-h-[120px] font-mono text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {tool.type === 'file_search' && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">
                                Alias {state.tools.filter(t => t.type === 'file_search').length > 1 && <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                value={tool.alias || ''}
                                onChange={(e) => updateTool(index, 'alias', e.target.value)}
                                placeholder={state.tools.filter(t => t.type === 'file_search').length > 1 ? "Required for multiple file_search tools" : "Optional alias for this tool"}
                                className={`h-9 ${state.tools.filter(t => t.type === 'file_search').length > 1 && !tool.alias?.trim() ? 'border-red-300 focus:border-red-500' : ''}`}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {state.tools.filter(t => t.type === 'file_search').length > 1 
                                  ? 'Unique alias required when multiple file_search tools are configured'
                                  : 'Optional alias to identify this tool in responses'
                                }
                              </p>
                              {state.tools.filter(t => t.type === 'file_search').length > 1 && !tool.alias?.trim() && (
                                <p className="text-xs text-red-500 mt-1">
                                  ⚠️ Alias is required when multiple file_search tools are present
                                </p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">Vector Store IDs</Label>
                              <Input
                                value={Array.isArray(tool.vector_store_ids) ? tool.vector_store_ids.join(', ') : tool.vector_store_ids || ''}
                                onChange={(e) => updateTool(index, 'vector_store_ids', e.target.value.split(',').map(id => id.trim()))}
                                placeholder="vs_123, vs_456"
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">Max Results</Label>
                              <Input
                                type="number"
                                value={tool.max_num_results || 5}
                                onChange={(e) => updateTool(index, 'max_num_results', parseInt(e.target.value) || 5)}
                                min={1}
                                max={50}
                                className="h-9"
                              />
                            </div>
                          </div>
                        )}

                        {tool.type === 'agentic_search' && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">
                                Alias {state.tools.filter(t => t.type === 'agentic_search').length > 1 && <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                value={tool.alias || ''}
                                onChange={(e) => updateTool(index, 'alias', e.target.value)}
                                placeholder={state.tools.filter(t => t.type === 'agentic_search').length > 1 ? "Required for multiple agentic_search tools" : "Optional alias for this tool"}
                                className={`h-9 ${state.tools.filter(t => t.type === 'agentic_search').length > 1 && !tool.alias?.trim() ? 'border-red-300 focus:border-red-500' : ''}`}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {state.tools.filter(t => t.type === 'agentic_search').length > 1 
                                  ? 'Unique alias required when multiple agentic_search tools are configured'
                                  : 'Optional alias to identify this tool in responses'
                                }
                              </p>
                              {state.tools.filter(t => t.type === 'agentic_search').length > 1 && !tool.alias?.trim() && (
                                <p className="text-xs text-red-500 mt-1">
                                  ⚠️ Alias is required when multiple agentic_search tools are present
                                </p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">Vector Store IDs</Label>
                              <Input
                                value={Array.isArray(tool.vector_store_ids) ? tool.vector_store_ids.join(', ') : tool.vector_store_ids || ''}
                                onChange={(e) => updateTool(index, 'vector_store_ids', e.target.value.split(',').map(id => id.trim()))}
                                placeholder="vs_123, vs_456"
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">Max Results</Label>
                              <Input
                                type="number"
                                value={tool.max_num_results || 5}
                                onChange={(e) => updateTool(index, 'max_num_results', parseInt(e.target.value) || 5)}
                                min={1}
                                max={50}
                                className="h-9"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {state.tools.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No tools configured yet.</p>
                        <p className="text-xs mt-1">Add tools from the main configuration panel to extend AI capabilities.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeConfigPanel === 'advanced' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-foreground mb-3 block">Advanced Parameters</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Fine-tune the AI model's behavior with advanced settings.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-border rounded-lg bg-muted">
                          <div className="flex items-center space-x-3 mb-3">
                            <Switch 
                              checked={state.stream} 
                              onCheckedChange={(checked) => updateState('stream', checked)} 
                            />
                            <div>
                              <Label className="text-sm font-medium text-foreground">Streaming</Label>
                              <p className="text-xs text-muted-foreground">Real-time response streaming</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border border-border rounded-lg bg-muted">
                          <div className="flex items-center space-x-3 mb-3">
                            <Switch 
                              checked={state.store} 
                              onCheckedChange={(checked) => updateState('store', checked)} 
                            />
                            <div>
                              <Label className="text-sm font-medium text-foreground">Store Response</Label>
                              <p className="text-xs text-muted-foreground">Save response for later use</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-foreground mb-3 block">Top-P (Nucleus Sampling)</Label>
                        <div className="space-y-4">
                          <Slider
                            value={[state.top_p]}
                            onValueChange={([value]) => updateState('top_p', value)}
                            max={1}
                            min={0}
                            step={0.1}
                            className="w-full [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.relative]:bg-primary/20"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Focused (0)</span>
                            <span className="font-mono px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded border border-primary/20 dark:border-primary/30">
                              {state.top_p}
                            </span>
                            <span>Diverse (1)</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Controls diversity by limiting token selection to the top cumulative probability mass
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-foreground mb-3 block">Max Output Tokens</Label>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground font-mono px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded border border-primary/20 dark:border-primary/30">
                                {state.max_output_tokens}
                              </span>
                              <span className="text-xs text-muted-foreground">tokens</span>
                            </div>
                            <Input
                              type="number"
                              value={state.max_output_tokens}
                              onChange={(e) => updateState('max_output_tokens', parseInt(e.target.value) || 2048)}
                              min={1}
                              placeholder="4096"
                              className="w-24 h-9 text-sm font-mono"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Common values: 1K, 2K, 4K, 8K, 16K, 32K+</span>
                            <span>Default: 2048</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Maximum number of tokens the model can generate. No upper limit - depends on your model's capabilities.
                          </p>
                        </div>
                      </div>



                      <div>
                        <Label className="text-sm font-medium text-foreground mb-3 block">Previous Response ID</Label>
                        <Input
                          value={state.previous_response_id}
                          onChange={(e) => updateState('previous_response_id', e.target.value)}
                          placeholder="resp_123456789"
                          className="h-10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Reference a previous response for context</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-foreground mb-3 block">Tool Choice</Label>
                        <Select 
                          value={typeof state.tool_choice === 'string' ? state.tool_choice : 'auto'} 
                          onValueChange={(value) => updateState('tool_choice', value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border">
                            <SelectItem value="auto" className="text-foreground hover:bg-accent">Auto</SelectItem>
                            <SelectItem value="none" className="text-foreground hover:bg-accent">None</SelectItem>
                            <SelectItem value="required" className="text-foreground hover:bg-accent">Required</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">Control when tools should be used</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Switch 
                          checked={state.parallel_tool_calls} 
                          onCheckedChange={(checked) => updateState('parallel_tool_calls', checked)} 
                        />
                        <div>
                          <Label className="text-sm font-medium text-foreground">Parallel Tool Calls</Label>
                          <p className="text-xs text-muted-foreground">Allow multiple tools to run simultaneously</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeConfigPanel === 'api' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-foreground mb-3 block">API & Model Configuration</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure your API endpoint, authentication, and model settings.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Model Configuration */}
                      <div className="p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg">
                        <h4 className="text-sm font-medium text-primary dark:text-primary-light mb-3">Model Configuration</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-foreground mb-2 block">Model Name</Label>
                            <Input
                              value={state.model}
                              onChange={(e) => updateState('model', e.target.value)}
                              placeholder="Enter any model name..."
                              className="h-10 font-mono focus:border-primary dark:focus:border-primary-light"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Enter any model name (e.g., gpt-4.1, claude-3-5-sonnet-20241022, gemini-2.5-pro)</p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-foreground mb-2 block">Quick Model Selection</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { name: 'GPT-4.1', value: 'gpt-4.1', provider: 'openai' },
                                { name: 'GPT-4.1 Mini', value: 'gpt-4.1-mini', provider: 'openai' },
                                { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022', provider: 'claude' },
                                { name: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022', provider: 'claude' },
                                { name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro', provider: 'gemini' },
                                { name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash', provider: 'gemini' },
                                { name: 'Llama 3.1 70B', value: 'llama-3.1-70b-versatile', provider: 'groq' },
                                { name: 'DeepSeek Chat', value: 'deepseek-chat', provider: 'deepseek' }
                              ].map((model) => (
                                <Button
                                  key={model.value}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    updateState('model', model.value);
                                    updateState('modelProvider', model.provider);
                                  }}
                                  className="h-8 text-xs hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 dark:hover:border-primary/40 text-left justify-start"
                                >
                                  {model.name}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-foreground mb-2 block">Model Provider</Label>
                            <Select 
                              value={state.modelProvider} 
                              onValueChange={(value) => {
                                updateState('modelProvider', value);
                                localStorage.setItem('imageGen_modelProvider', value);
                              }}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border border-border">
                                <SelectItem value="openai" className="text-foreground hover:bg-accent">OpenAI</SelectItem>
                                <SelectItem value="claude" className="text-foreground hover:bg-accent">Anthropic (Claude)</SelectItem>
                                <SelectItem value="gemini" className="text-foreground hover:bg-accent">Google (Gemini)</SelectItem>
                                <SelectItem value="groq" className="text-foreground hover:bg-accent">Groq</SelectItem>
                                <SelectItem value="deepseek" className="text-foreground hover:bg-accent">DeepSeek</SelectItem>
                                <SelectItem value="xai" className="text-foreground hover:bg-accent">xAI (Grok)</SelectItem>
                                <SelectItem value="custom" className="text-foreground hover:bg-accent">Custom Base URL</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">The AI model provider for your requests</p>
                          </div>

                          {state.modelProvider === 'custom' && (
                            <div>
                              <Label className="text-sm font-medium text-foreground mb-2 block">Custom Provider Base URL</Label>
                              <Input
                                value={state.customProviderUrl || ''}
                                onChange={(e) => updateState('customProviderUrl', e.target.value)}
                                placeholder="https://api.example.com/v1"
                                className="h-10 font-mono focus:border-primary dark:focus:border-primary-light"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Base endpoint for your custom provider (include up to /v1). Model format will be: &lt;base-endpoint&gt;@&lt;model&gt;
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <strong>Example:</strong> https://api.openai.com/v1 → https://api.openai.com/v1@gpt-4
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* API Configuration */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-foreground">API Settings</h4>
                        
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-2 block">Base URL</Label>
                                                  <Input
                          value={state.baseUrl}
                          onChange={(e) => {
                            updateState('baseUrl', e.target.value);
                            localStorage.setItem('imageGen_baseUrl', e.target.value);
                          }}
                          placeholder="http://localhost:8080"
                          className="h-10 font-mono"
                        />
                          <p className="text-xs text-muted-foreground mt-1">The base URL for your API endpoint</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-foreground mb-2 block">API Key</Label>
                                                  <Input
                          type="password"
                          value={state.apiKey}
                          onChange={(e) => {
                            updateState('apiKey', e.target.value);
                            localStorage.setItem('imageGen_apiKey', e.target.value);
                          }}
                          placeholder="Your API key"
                          className="h-10 font-mono"
                        />
                          <p className="text-xs text-muted-foreground mt-1">Your authentication key for API access</p>
                        </div>
                      </div>

                      {/* Connection Test */}
                      <div className="p-4 bg-success/5 dark:bg-success/10 border border-success/20 dark:border-success/30 rounded-lg">
                        <h4 className="text-sm font-medium text-success dark:text-success-light mb-2">Connection Test</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Test your API configuration to ensure it's working correctly.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover:bg-success/5 dark:hover:bg-success/10 hover:border-success/30 dark:hover:border-success/40"
                          onClick={async () => {
                            if (!state.apiKey.trim()) {
                              toast.error('Please set your API key first');
                              return;
                            }
                            
                            if (!state.model.trim()) {
                              toast.error('Please set a model first');
                              return;
                            }

                            try {
                              toast.info('Testing connection...');
                              
                              const testBody = {
                                model: state.modelProvider === 'custom' && state.customProviderUrl 
                                  ? `${state.customProviderUrl}@${state.model}`
                                  : `${state.modelProvider}@${state.model}`,
                                input: 'ping',
                                stream: false,
                                store: false,
                                max_output_tokens: 10
                              };

                              const response = await fetch(`${state.baseUrl}/v1/responses`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${state.apiKey}`,
                                  ...(state.modelProvider !== 'openai' && { 'x-model-provider': state.modelProvider })
                                },
                                body: JSON.stringify(testBody)
                              });

                              if (response.ok) {
                                const data = await response.json();
                                toast.success('Connection successful! API is working correctly.');
                              } else {
                                const errorText = await response.text();
                                let errorMessage = `Connection failed (${response.status})`;
                                
                                // Provide specific guidance based on error type
                                if (response.status === 401) {
                                  errorMessage += ': Invalid API key. Please check your API key configuration.';
                                } else if (response.status === 400) {
                                  errorMessage += ': Bad request. Please verify your model name and provider configuration.';
                                } else if (response.status === 404) {
                                  errorMessage += ': Model not found. Please check if the model name is correct and supported by your provider.';
                                } else if (response.status === 403) {
                                  errorMessage += ': Access forbidden. Please verify your API key has access to the specified model.';
                                } else if (response.status >= 500) {
                                  errorMessage += ': Server error. The API service may be temporarily unavailable.';
                                } else {
                                  errorMessage += `: ${errorText}`;
                                }
                                
                                toast.error(errorMessage);
                                
                                // Additional guidance for common issues
                                if (response.status === 400 || response.status === 404) {
                                  setTimeout(() => {
                                    toast.info('💡 Tip: Check that your model name matches your provider (e.g., "gpt-4o" for OpenAI, "claude-3-5-sonnet-20241022" for Anthropic)');
                                  }, 1000);
                                }
                              }
                            } catch (error: any) {
                              toast.error(`Connection failed: ${error.message}`);
                            }
                          }}
                        >
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeConfigPanel === 'output' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-foreground mb-3 block">Output Format Configuration</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Control how the AI formats its responses.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-foreground mb-2 block">Format Type</Label>
                        <Select value={state.text_format_type} onValueChange={(value) => updateState('text_format_type', value)}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border">
                            <SelectItem value="text" className="text-foreground hover:bg-accent">Plain Text</SelectItem>
                            <SelectItem value="json_object" className="text-foreground hover:bg-accent">JSON Object</SelectItem>
                            <SelectItem value="json_schema" className="text-foreground hover:bg-accent">JSON Schema</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">Choose how the AI should format its responses</p>
                      </div>

                      {state.text_format_type !== 'text' && (
                        <div className="p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg">
                          <h4 className="text-sm font-medium text-primary dark:text-primary-light mb-2">JSON Output Settings</h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            When using JSON output, the AI will structure its responses according to your specifications.
                          </p>
                          
                          {state.text_format_type === 'json_schema' && (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium text-foreground mb-2 block">Schema Name</Label>
                                <Input
                                  value={state.json_schema_name}
                                  onChange={(e) => updateState('json_schema_name', e.target.value)}
                                  placeholder="response_schema"
                                  className="h-9 focus:border-primary dark:focus:border-primary-light"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium text-foreground mb-2 block">Description</Label>
                                <Input
                                  value={state.json_schema_description}
                                  onChange={(e) => updateState('json_schema_description', e.target.value)}
                                  placeholder="Describe the purpose of this schema..."
                                  className="h-9 focus:border-primary dark:focus:border-primary-light"
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch 
                                  checked={state.json_schema_strict} 
                                  onCheckedChange={(checked) => updateState('json_schema_strict', checked)} 
                                />
                                <Label className="text-sm font-medium text-foreground">Strict Mode</Label>
                                <Badge variant="outline" className="text-xs">
                                  {state.json_schema_strict ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Strict mode enforces exact schema compliance
                              </p>

                              <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openConfigPanel('json-schema')}
                                  className="w-full h-9 bg-card border-border text-foreground hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 dark:hover:border-primary/40"
                                >
                                  <Code2 className="h-4 w-4 mr-2" />
                                  Edit JSON Schema
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col space-y-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={copyRequestBody}
            title="Copy JSON"
            className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent border border-border text-muted-foreground"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={showCurlCommand}
            title="Show cURL"
            className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent border border-border text-muted-foreground"
          >
            <Code2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={addChatMessage}
            title="Add Message"
            className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent border border-border text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={clearChatHistory}
            title="Clear Chat"
            className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent border border-border text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {streamingEvents.length > 0 && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowEventsModal(true)}
              title={`View Streaming Events (${streamingEvents.length})`}
              className="h-12 w-12 rounded-full shadow-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary relative"
            >
              <Sparkles className="h-4 w-4" />
              {isStreaming && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse"></div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono">
                {streamingEvents.length > 99 ? '99+' : streamingEvents.length}
              </div>
            </Button>
          )}
          {response && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={downloadResponse}
              title="Download Response"
              className="h-12 w-12 rounded-full shadow-lg bg-card hover:bg-accent border border-border text-muted-foreground"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="flex-1 flex flex-col bg-card">

          {/* Chat Messages */}
          <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
            <ScrollArea className="h-full p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {chatHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <div className="text-center space-y-4 max-w-md">
                    <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-primary dark:text-primary-light" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Start your conversation</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Type a message below to start chatting, or add system messages to set context.
                      </p>
                    </div>
                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg p-4 text-left">
                      <h4 className="text-sm font-medium text-primary dark:text-primary-light mb-2">Tips:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Type messages in the input below</li>
                        <li>• Press Enter or click Send to add to chat</li>
                        <li>• Use "Add Message" for system prompts</li>
                        <li>• Click Run to get AI responses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] group relative ${
                      message.role === 'system'
                        ? 'bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning-light border border-warning/20 dark:border-warning/30'
                        : 'bg-muted text-foreground border border-border'
                    } rounded-lg p-4 shadow-sm`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            message.role === 'system'
                              ? 'bg-warning/20 dark:bg-warning/30 text-warning dark:text-warning-light border-warning/30 dark:border-warning/40'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {message.role}
                        </Badge>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editChatMessage(index)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChatMessage(index)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-error hover:bg-error/5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {message.isEditing ? (
                        <div className="space-y-2">
                          <Select 
                            value={message.role} 
                            onValueChange={(value: 'user' | 'assistant' | 'system') => 
                              updateChatMessage(index, 'role', value)
                            }
                          >
                                                    <SelectTrigger className="h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border">
                          <SelectItem value="user" className="text-foreground hover:bg-accent">User</SelectItem>
                          <SelectItem value="assistant" className="text-foreground hover:bg-accent">Assistant</SelectItem>
                          <SelectItem value="system" className="text-foreground hover:bg-accent">System</SelectItem>
                        </SelectContent>
                          </Select>
                          <Textarea
                            value={message.content}
                            onChange={(e) => updateChatMessage(index, 'content', e.target.value)}
                            className="min-h-[60px] text-sm"
                          />
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => saveChatMessage(index)} className="border-border text-foreground hover:bg-accent">
                              Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => cancelEditChatMessage(index)} className="border-border text-foreground hover:bg-accent">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        renderMessageContent(message.content)
                      )}
                      {message.timestamp && (
                        <div className="text-xs mt-2 text-muted-foreground opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm max-w-[80%]">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Loader2 className="h-4 w-4 animate-spin text-primary dark:text-primary-light" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">AI is thinking...</p>
                        <div className="mt-2 flex space-x-1">
                          <div className="h-1 w-2 bg-current opacity-60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="h-1 w-2 bg-current opacity-60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                          <div className="h-1 w-2 bg-current opacity-60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </ScrollArea>
          </div>

          {/* Chat Input */}
          <div className="border-t border-border bg-card p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-3">
                <Select value={currentMessageRole} onValueChange={(value: 'user' | 'system') => setCurrentMessageRole(value)}>
                  <SelectTrigger className="w-20 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    <SelectItem value="user" className="text-foreground hover:bg-accent">User</SelectItem>
                    <SelectItem value="system" className="text-foreground hover:bg-accent">System</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1 flex space-x-2">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 h-12 resize-none focus:border-primary dark:focus:border-primary-light py-3 leading-none"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={sendChatMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="h-12 px-4 bg-success hover:bg-success-light dark:bg-success-light dark:hover:bg-success text-white shadow-sm border border-success/20 dark:border-success/30"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* cURL Command Modal */}
        <Dialog open={showCurlModal} onOpenChange={setShowCurlModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">cURL Command</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted text-success dark:text-success-light p-4 rounded-lg font-mono text-sm overflow-auto max-h-[60vh]">
                <pre className="whitespace-pre-wrap break-all">{curlCommand}</pre>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCurlModal(false)} className="border-border text-foreground hover:bg-accent">
                  Close
                </Button>
                <Button variant="outline" onClick={copyCurlToClipboard} className="border-border text-foreground hover:bg-accent">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Streaming Events Modal */}
        <Dialog open={showEventsModal} onOpenChange={setShowEventsModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3 text-foreground">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-success rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span>Streaming Events Timeline</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {streamingEvents.length} events
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-3">
                {streamingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No streaming events captured yet</p>
                  </div>
                ) : (
                  streamingEvents.map((event, index) => {
                    const getEventIcon = (type: string) => {
                      if (type.includes('created')) return <Play className="h-3 w-3" />;
                      if (type.includes('delta')) return <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />;
                      if (type.includes('image_generation')) return <div className="w-3 h-3 bg-warning rounded-full" />;
                      if (type.includes('file_search') || type.includes('agentic_search')) return <div className="w-3 h-3 bg-success rounded-full" />;
                      if (type.includes('completed')) return <CheckCircle className="h-3 w-3" />;
                      if (type.includes('error')) return <XCircle className="h-3 w-3" />;
                      return <Info className="h-3 w-3" />;
                    };

                    const getEventColor = (type: string) => {
                      if (type.includes('created')) return 'border-primary/30 bg-primary/5';
                      if (type.includes('delta')) return 'border-primary/30 bg-primary/5';
                      if (type.includes('image_generation')) return 'border-warning/30 bg-warning/5';
                      if (type.includes('file_search') || type.includes('agentic_search')) return 'border-success/30 bg-success/5';
                      if (type.includes('completed')) return 'border-success/30 bg-success/5';
                      if (type.includes('error')) return 'border-error/30 bg-error/5';
                      return 'border-border bg-muted/50';
                    };

                    const getEventTextColor = (type: string) => {
                      if (type.includes('created')) return 'text-primary';
                      if (type.includes('delta')) return 'text-primary';
                      if (type.includes('image_generation')) return 'text-warning';
                      if (type.includes('file_search') || type.includes('agentic_search')) return 'text-success';
                      if (type.includes('completed')) return 'text-success';
                      if (type.includes('error')) return 'text-error';
                      return 'text-foreground';
                    };

                    return (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${getEventColor(event.type)}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`p-2 rounded-full ${getEventColor(event.type)} ${getEventTextColor(event.type)}`}>
                              {getEventIcon(event.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className={`text-sm font-semibold ${getEventTextColor(event.type)}`}>
                                {event.type}
                              </h4>
                              <Badge variant="outline" className="text-xs font-mono">
                                #{index + 1}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            {event.delta && (
                              <div className="mb-2">
                                <Label className="text-xs font-medium text-muted-foreground">Delta:</Label>
                                <div className="bg-muted/50 p-2 rounded mt-1 font-mono text-xs break-all">
                                  {JSON.stringify(event.delta)}
                                </div>
                              </div>
                            )}
                            
                            {event.text && (
                              <div className="mb-2">
                                <Label className="text-xs font-medium text-muted-foreground">Text:</Label>
                                <div className="bg-muted/50 p-2 rounded mt-1 text-xs max-h-32 overflow-y-auto">
                                  {event.text}
                                </div>
                              </div>
                            )}
                            
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Raw Event Data
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="bg-muted/80 p-3 rounded-lg mt-2 font-mono text-xs overflow-auto max-h-48">
                                  <pre className="whitespace-pre-wrap break-all">
                                    {JSON.stringify(event, null, 2)}
                                  </pre>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Real-time streaming events captured during API communication</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(streamingEvents, null, 2));
                    toast.success('Events copied to clipboard!');
                  }}
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy Events
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStreamingEvents([])}
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Clear Events
                </Button>
                <Button variant="outline" onClick={() => setShowEventsModal(false)} className="border-border text-foreground hover:bg-accent">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default ApiPlayground; 