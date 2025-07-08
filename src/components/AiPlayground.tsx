import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import UnifiedCard from '@/components/ui/unified-card';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import ConfigurationPanel from './ConfigurationPanel';
import PlaygroundSidebar from './PlaygroundSidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

const getProviderApiKey = (provider: string): string => {
  try {
    const saved = localStorage.getItem('apiKeys');
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
  
  // Playground state
  const [activeTab, setActiveTab] = useState('responses');
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  
  const [jsonSchemaContent, setJsonSchemaContent] = useState('');
  const [jsonSchemaName, setJsonSchemaName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedApiKey = localStorage.getItem('aiPlayground_apiKey') || '';
    const savedBaseUrl = localStorage.getItem('aiPlayground_baseUrl') || 'http://localhost:8080';
    const savedModelProvider = localStorage.getItem('aiPlayground_modelProvider') || 'openai';
    const savedModelName = localStorage.getItem('aiPlayground_modelName') || 'gpt-4o';
    const savedImageModelProvider = localStorage.getItem('aiPlayground_imageModelProvider') || 'gemini';
    const savedImageModelName = localStorage.getItem('aiPlayground_imageModelName') || 'imagen-3.0-generate-002';
    const savedImageProviderKey = localStorage.getItem('aiPlayground_imageProviderKey') || '';
    const savedSelectedVectorStore = localStorage.getItem('aiPlayground_selectedVectorStore') || '';
    const savedInstructions = localStorage.getItem('aiPlayground_instructions') || '';
    const savedTemperature = parseFloat(localStorage.getItem('aiPlayground_temperature') || '1.0');
    const savedMaxTokens = parseInt(localStorage.getItem('aiPlayground_maxTokens') || '2048');
    const savedTopP = parseFloat(localStorage.getItem('aiPlayground_topP') || '1.0');
    const savedStoreLogs = localStorage.getItem('aiPlayground_storeLogs') === 'true';
    const savedTextFormat = (localStorage.getItem('aiPlayground_textFormat') || 'text') as 'text' | 'json_object' | 'json_schema';
    const savedToolChoice = (localStorage.getItem('aiPlayground_toolChoice') || 'auto') as 'auto' | 'none';
    const savedPromptMessages = JSON.parse(localStorage.getItem('aiPlayground_promptMessages') || '[]');
    
    setApiKey(savedApiKey);
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
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('aiPlayground_apiKey', apiKey);
    localStorage.setItem('aiPlayground_baseUrl', baseUrl);
    localStorage.setItem('aiPlayground_modelProvider', modelProvider);
    localStorage.setItem('aiPlayground_modelName', modelName);
    localStorage.setItem('aiPlayground_imageModelProvider', imageModelProvider);
    localStorage.setItem('aiPlayground_imageModelName', imageModelName);
    localStorage.setItem('aiPlayground_imageProviderKey', imageProviderKey);
    localStorage.setItem('aiPlayground_selectedVectorStore', selectedVectorStore);
    localStorage.setItem('aiPlayground_instructions', instructions);
    localStorage.setItem('aiPlayground_temperature', temperature.toString());
    localStorage.setItem('aiPlayground_maxTokens', maxTokens.toString());
    localStorage.setItem('aiPlayground_topP', topP.toString());
    localStorage.setItem('aiPlayground_storeLogs', storeLogs.toString());
    localStorage.setItem('aiPlayground_textFormat', textFormat);
    localStorage.setItem('aiPlayground_toolChoice', toolChoice);
    localStorage.setItem('aiPlayground_promptMessages', JSON.stringify(promptMessages));
  }, [apiKey, baseUrl, modelProvider, modelName, imageModelProvider, imageModelName, imageProviderKey, selectedVectorStore, instructions, temperature, maxTokens, topP, storeLogs, textFormat, toolChoice, promptMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    setPreviousResponseId(null);
    toast.success('Conversation reset');
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
    
    if (previousResponseId) {
      requestBody.previous_response_id = previousResponseId;
    }

    try {
      const response = await fetch('http://localhost:6644/v1/responses', {
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
                  if (data.type === 'response.created' || data.type === 'response.completed') {
                    if (data.response?.id) {
                      responseId = data.response.id;
                    }
                  } else if (data.type === 'response.output_text.delta') {
                    // Start or continue streaming
                    if (!isStreaming) {
                      isStreaming = true;
                      // Remove loading state when streaming starts
                      setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                          ? { ...msg, isLoading: false }
                          : msg
                      ));
                    }
                    
                    if (data.delta) {
                      streamingContent += data.delta;
                      
                      // Check if we have a complete JSON object for real-time formatting
                      let displayContent = streamingContent;
                      if (textFormat === 'json_object' || textFormat === 'json_schema') {
                        try {
                          // Try to parse as JSON - if successful, it's complete JSON
                          JSON.parse(streamingContent);
                          // If parsing succeeds, keep the JSON as-is for formatting
                          displayContent = streamingContent;
                        } catch {
                          // If parsing fails, it's incomplete JSON - show as-is
                          displayContent = streamingContent;
                        }
                      }
                      
                      // Update message content in real-time
                      setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              content: displayContent,
                              type: 'text',
                              hasThinkTags: false,
                              isLoading: false
                            }
                          : msg
                      ));
                    }
                  } else if (data.type === 'response.output_text.done') {
                    // Streaming completed for this output
                    isStreaming = false;
                    if (data.text) {
                      // Use the complete text from the done event
                      streamingContent = data.text;
                      setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              content: streamingContent,
                              type: 'text',
                              hasThinkTags: false,
                              isLoading: false
                            }
                          : msg
                      ));
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
        textarea.style.height = '130px';
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
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(Math.min(textarea.scrollHeight, 300), 130) + 'px';
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
    <div className="flex h-full bg-background">
      {/* Left Sidebar - 10% */}
      <PlaygroundSidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Configuration Panel - 30% */}
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
        selectedVectorStore={selectedVectorStore}
        onVectorStoreSelect={handleVectorStoreSelect}
        onResetConversation={resetConversation}
        openApiKeysModal={apiKeysModalOpen}
        onApiKeysModalChange={setApiKeysModalOpen}
        jsonSchemaContent={jsonSchemaContent}
        setJsonSchemaContent={setJsonSchemaContent}
        jsonSchemaName={jsonSchemaName}
        setJsonSchemaName={setJsonSchemaName}
      />

      {/* Chat Area - 60% */}
      <div className="w-[60%] flex flex-col">
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
                type={message.type}
                timestamp={message.timestamp}
                hasThinkTags={message.hasThinkTags}
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
                className="w-full min-h-[130px] max-h-[300px] resize-none rounded-xl border border-border bg-muted/50 px-4 py-4 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-positive-trend/60 transition-all duration-200"
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
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  title="Auto-clear conversation"
                  onClick={resetConversation}
                >
                  <span className="text-xs">🔄</span>
                </Button>
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
  );
};

export default AiPlayground; 