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
}

const ApiPlayground: React.FC = () => {
  const [state, setState] = useState<ApiPlaygroundState>({
    model: 'gpt-4o',
    input: 'Hello, how are you?',
    inputType: 'text',
    stream: false,
    store: true,
    background: false,
    temperature: 1.0,
    top_p: 1.0,
    max_output_tokens: 4096,
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
    { role: 'user', content: 'Hello, how are you?' }
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
          input: 'Hello! Can you tell me a joke?',
          inputType: 'text',
          stream: false,
          store: true,
          temperature: 1.0,
          tools: [],
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
          temperature: 0.8,
          tools: [{
            type: 'image_generation',
            model: 'gpt-image-1',
            size: 'auto',
            quality: 'auto',
            output_format: 'png'
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
          temperature: 0.7,
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
    const newTool: Tool = { type: toolType };
    
    // Add default configurations for specific tools
    switch (toolType) {
      case 'file_search':
        newTool.vector_store_ids = [''];
        newTool.max_num_results = 5;
        break;
      case 'image_generation':
        newTool.model = 'gpt-image-1';
        newTool.size = 'auto';
        newTool.quality = 'auto';
        newTool.output_format = 'png';
        break;
      case 'web_search_preview':
        newTool.search_context_size = 'medium';
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
  };

  const removeTool = (index: number) => {
    setState(prev => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index)
    }));
  };

  const updateTool = (index: number, field: string, value: any) => {
    setState(prev => ({
      ...prev,
      tools: prev.tools.map((tool, i) => 
        i === index ? { ...tool, [field]: value } : tool
      )
    }));
  };

  const buildRequestBody = () => {
    // Use chat history if available, otherwise fall back to input/messages
    let inputData;
    if (chatHistory.length > 0) {
      // Send full chat history as messages
      inputData = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    } else {
      // Fall back to original input logic
      inputData = state.inputType === 'text' ? state.input : messages;
    }

    const body: any = {
      model: `${state.modelProvider}@${state.model}`,
      input: inputData,
      stream: state.stream,
      store: state.store
    };

    // Add optional parameters only if they differ from defaults
    if (state.background) body.background = true;
    if (state.temperature !== 1.0) body.temperature = state.temperature;
    if (state.top_p !== 1.0) body.top_p = state.top_p;
    if (state.max_output_tokens !== 4096) body.max_output_tokens = state.max_output_tokens;
    if (state.instructions) body.instructions = state.instructions;
    if (state.previous_response_id) body.previous_response_id = state.previous_response_id;
    if (state.service_tier !== 'auto') body.service_tier = state.service_tier;
    if (state.truncation !== 'disabled') body.truncation = state.truncation;
    if (!state.parallel_tool_calls) body.parallel_tool_calls = false;

    // Add tools if any
    if (state.tools.length > 0) {
      body.tools = state.tools;
      if (state.tool_choice !== 'auto') body.tool_choice = state.tool_choice;
    }

    // Add text configuration if not default
    if (state.text_format_type !== 'text') {
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
    }

    // Add reasoning for o-series models
    if (state.model.startsWith('o1') || state.model.startsWith('o3')) {
      body.reasoning = {
        effort: state.reasoning_effort,
        summary: state.reasoning_summary
      };
    }

    // Add include options
    if (state.include.length > 0) {
      body.include = state.include;
    }

    // Add metadata
    if (Object.keys(state.metadata).length > 0) {
      body.metadata = state.metadata;
    }

    return body;
  };

  const executeRequest = async () => {
    if (!state.apiKey.trim()) {
      toast.error('Please set your API key');
      return;
    }

    setIsLoading(true);
    setResponse(null);
    const startTime = Date.now();

    // Add user message to chat history only if we're starting fresh and have no chat history
    // and there's content in the input field
    if (chatHistory.length === 0 && state.input && typeof state.input === 'string' && state.input.trim()) {
      setChatHistory(prev => [...prev, {
        role: 'user',
        content: (state.input as string).trim(),
        timestamp: new Date().toISOString()
      }]);
    }

    try {
      const requestBody = buildRequestBody();
      
      const response = await fetch(`${state.baseUrl}/v1/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.apiKey}`,
          ...(state.modelProvider !== 'openai' && { 'x-model-provider': state.modelProvider })
        },
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
        responseData = { type: 'stream', status: 'streaming...', chunks: [] };
        setResponse(responseData);
        toast.info('Streaming response started');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (reader) {
          try {
            let buffer = '';
            let assistantMessage = '';
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                const eventDataStr = trimmedLine.substring(6).trim();
                if (eventDataStr === '[DONE]') break;

                try {
                  const eventData = JSON.parse(eventDataStr);
                  setResponse(prev => ({
                    ...prev,
                    chunks: [...(prev?.chunks || []), eventData],
                    lastChunk: eventData
                  }));

                  // Extract text content for chat display
                  if (eventData.type === 'response.output_text.delta') {
                    assistantMessage += eventData.delta;
                  } else if (eventData.type === 'response.output_text.done') {
                    assistantMessage = eventData.text;
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
            
            // Add assistant response to chat history
            if (assistantMessage) {
              setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: assistantMessage,
                timestamp: new Date().toISOString()
              }]);
            }
            
            toast.success('Streaming completed!');
          } catch (streamError) {
            console.error('Streaming error:', streamError);
            toast.error('Streaming interrupted');
          } finally {
            reader.releaseLock();
          }
        }
      } else {
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
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString()
      }]);
      
      setResponse({
        error: true,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`Request failed: ${error.message}`);
    } finally {
      setIsLoading(false);
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

    setState(preset);
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
    
    // Add message to chat history
    setChatHistory(prev => [...prev, {
      role: currentMessageRole,
      content: currentMessage.trim(),
      timestamp: new Date().toISOString()
    }]);
    
    setCurrentMessage('');
    
    // If it's a user message, automatically execute the API request
    if (currentMessageRole === 'user') {
      // Small delay to ensure the message is added to chat history
      setTimeout(() => {
        executeRequest();
      }, 100);
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
                      {state.top_p !== 1.0 && (
                        <Badge variant="outline" className="text-xs bg-error/10 dark:bg-error/20 text-error dark:text-error-light border-error/20 dark:border-error/30">
                          Top-P: {state.top_p}
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
                  <Button variant="outline" size="sm" onClick={() => addTool('web_search_preview')} className="h-8 text-xs border-border text-foreground hover:bg-success/5 dark:hover:bg-success/10 hover:border-success/30 dark:hover:border-success/40">
                    + Web Search
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
                              <Label className="text-sm font-medium mb-2 block">Model</Label>
                              <Select 
                                value={tool.model || 'gpt-image-1'} 
                                onValueChange={(value) => updateTool(index, 'model', value)}
                              >
                                                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border border-border">
                                <SelectItem value="gpt-image-1" className="text-foreground hover:bg-accent">GPT Image 1</SelectItem>
                                <SelectItem value="dall-e-3" className="text-foreground hover:bg-accent">DALL-E 3</SelectItem>
                              </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Size</Label>
                                <Select 
                                  value={tool.size || 'auto'} 
                                  onValueChange={(value) => updateTool(index, 'size', value)}
                                >
                                                                  <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-border">
                                  <SelectItem value="auto" className="text-foreground hover:bg-accent">Auto</SelectItem>
                                  <SelectItem value="1024x1024" className="text-foreground hover:bg-accent">1024x1024</SelectItem>
                                  <SelectItem value="1792x1024" className="text-foreground hover:bg-accent">1792x1024</SelectItem>
                                  <SelectItem value="1024x1792" className="text-foreground hover:bg-accent">1024x1792</SelectItem>
                                </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Quality</Label>
                                <Select 
                                  value={tool.quality || 'auto'} 
                                  onValueChange={(value) => updateTool(index, 'quality', value)}
                                >
                                                                  <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-border">
                                  <SelectItem value="auto" className="text-foreground hover:bg-accent">Auto</SelectItem>
                                  <SelectItem value="standard" className="text-foreground hover:bg-accent">Standard</SelectItem>
                                  <SelectItem value="hd" className="text-foreground hover:bg-accent">HD</SelectItem>
                                </SelectContent>
                                </Select>
                              </div>
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

                        {tool.type === 'web_search_preview' && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Search Context Size</Label>
                              <Select 
                                value={tool.search_context_size || 'medium'} 
                                onValueChange={(value) => updateTool(index, 'search_context_size', value)}
                              >
                                                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border border-border">
                                <SelectItem value="small" className="text-foreground hover:bg-accent">Small</SelectItem>
                                <SelectItem value="medium" className="text-foreground hover:bg-accent">Medium</SelectItem>
                                <SelectItem value="large" className="text-foreground hover:bg-accent">Large</SelectItem>
                              </SelectContent>
                              </Select>
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
                        <Label className="text-sm font-medium text-foreground mb-3 block">Service Tier</Label>
                        <Select value={state.service_tier} onValueChange={(value) => updateState('service_tier', value)}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border">
                            <SelectItem value="auto" className="text-foreground hover:bg-accent">Auto</SelectItem>
                            <SelectItem value="default" className="text-foreground hover:bg-accent">Default</SelectItem>
                            <SelectItem value="scale" className="text-foreground hover:bg-accent">Scale</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">Choose the service tier for processing</p>
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
                            <p className="text-xs text-muted-foreground mt-1">Enter any model name (e.g., gpt-4o, claude-3-5-sonnet-20241022, gemini-1.5-pro)</p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-foreground mb-2 block">Quick Model Selection</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { name: 'GPT-4o', value: 'gpt-4o', provider: 'openai' },
                                { name: 'GPT-4o Mini', value: 'gpt-4o-mini', provider: 'openai' },
                                { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022', provider: 'claude' },
                                { name: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022', provider: 'claude' },
                                { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro', provider: 'gemini' },
                                { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash', provider: 'gemini' },
                                { name: 'Llama 3.1 70B', value: 'llama-3.1-70b-versatile', provider: 'groq' },
                                { name: 'DeepSeek Chat', value: 'deepseek-chat', provider: 'deepseek' },
                                { name: 'Grok Beta', value: 'grok-beta', provider: 'xai' },
                                { name: 'GPT-4 Turbo', value: 'gpt-4-turbo', provider: 'openai' }
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
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">The AI model provider for your requests</p>
                          </div>
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
                                model: `${state.modelProvider}@${state.model}`,
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
                        <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                          {message.content}
                        </div>
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
    </div>
  );
};

export default ApiPlayground; 