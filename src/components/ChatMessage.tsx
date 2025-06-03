import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Code, Copy, Check, X, User, Bot, AlertTriangle } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image';
  timestamp: Date;
  hasThinkTags?: boolean;
  // New props for code generation
  apiKey?: string;
  baseUrl?: string;
  modelProvider?: string;
  modelName?: string;
  imageModelProvider?: string;
  imageModelName?: string;
  imageProviderKey?: string;
  selectedVectorStore?: string;
  instructions?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  role, 
  content, 
  type = 'text', 
  timestamp,
  hasThinkTags = false,
  apiKey = '',
  baseUrl = 'http://localhost:8080',
  modelProvider = 'openai',
  modelName = 'gpt-4.1-mini',
  imageModelProvider = 'gemini',
  imageModelName = 'imagen-3.0-generate-002',
  imageProviderKey = '',
  selectedVectorStore = '',
  instructions = 'Answer questions using information from the provided documents when relevant. For image generation requests, create images as requested.'
}) => {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'python'>('curl');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);

  // Function to mask API keys
  const maskApiKey = (key: string): string => {
    if (!key || key === 'YOUR_API_KEY' || key === 'YOUR_IMAGE_PROVIDER_KEY') {
      return key;
    }
    if (key.length <= 8) {
      return '*'.repeat(key.length);
    }
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  // Function to parse content with think tags - redesigned with Geist UI
  const parseContentWithThinkTags = (content: string) => {
    if (!hasThinkTags || !content.includes('<think>')) {
      return <p className="whitespace-pre-wrap leading-relaxed text-foreground dark:text-white">{content}</p>;
    }

    const parts = [];
    let currentIndex = 0;
    let partKey = 0;
    let thinkBlockNumber = 1;

    while (currentIndex < content.length) {
      const thinkStart = content.indexOf('<think>', currentIndex);
      
      if (thinkStart === -1) {
        // No more think tags, add remaining content
        const remainingContent = content.substring(currentIndex);
        if (remainingContent.trim()) {
          parts.push(
            <p key={partKey++} className="whitespace-pre-wrap leading-relaxed text-foreground dark:text-white">
              {remainingContent}
            </p>
          );
        }
        break;
      }

      // Add content before think tag
      if (thinkStart > currentIndex) {
        const beforeThink = content.substring(currentIndex, thinkStart);
        if (beforeThink.trim()) {
          parts.push(
            <p key={partKey++} className="whitespace-pre-wrap leading-relaxed text-foreground dark:text-white">
              {beforeThink}
            </p>
          );
        }
      }

      // Find the closing think tag
      const thinkEnd = content.indexOf('</think>', thinkStart);
      if (thinkEnd === -1) {
        // No closing tag found, treat rest as think content
        const thinkContent = content.substring(thinkStart + 7);
        if (thinkContent.trim()) {
          parts.push(
            <div key={partKey++} className="my-4 p-4 bg-warning/5 dark:bg-warning/10 border-l-4 border-warning rounded-r-lg shadow-xs">
              <div className="flex items-center mb-2">
                <span className="text-xs font-medium text-warning dark:text-warning-light uppercase tracking-wide">
                  🤔 AI Thinking #{thinkBlockNumber}
                </span>
              </div>
              <p className="text-sm text-warning-dark dark:text-warning-light italic whitespace-pre-wrap leading-relaxed">
                {thinkContent}
              </p>
            </div>
          );
        }
        break;
      }

      // Add think content
      const thinkContent = content.substring(thinkStart + 7, thinkEnd);
      if (thinkContent.trim()) {
        parts.push(
          <div key={partKey++} className="my-4 p-4 bg-warning/5 dark:bg-warning/10 border-l-4 border-warning rounded-r-lg shadow-xs">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-warning dark:text-warning-light uppercase tracking-wide">
                🤔 AI Thinking #{thinkBlockNumber}
              </span>
            </div>
            <p className="text-sm text-warning-dark dark:text-warning-light italic whitespace-pre-wrap leading-relaxed">
              {thinkContent}
            </p>
          </div>
        );
        thinkBlockNumber++;
      }

      currentIndex = thinkEnd + 8;
    }

    return <div className="space-y-3">{parts}</div>;
  };

  // Function to check if content looks like a base64 image
  const isImageContent = (content: string): boolean => {
    // Remove any data URL prefix if present
    const cleanContent = content.replace(/^data:image\/[^;]+;base64,/, '').trim();
    
    // Check if it looks like base64 and has image signatures
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const isValidBase64 = base64Regex.test(cleanContent);
    
    // Check for common image format signatures
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

    // Must be valid base64, have image signature, and be reasonably long
    return isValidBase64 && hasImageSignature && cleanContent.length > 100;
  };

  // Function to validate and clean base64 image data
  const validateAndCleanBase64 = (base64Content: string): { isValid: boolean; cleanBase64: string; issues: string[] } => {
    const issues: string[] = [];
    let cleanBase64 = base64Content.replace(/^data:image\/[^;]+;base64,/, '');
    
    // Remove any whitespace or newlines
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    
    // Check if base64 is properly padded (should be multiple of 4)
    const paddingNeeded = cleanBase64.length % 4;
    if (paddingNeeded > 0) {
      const padding = '='.repeat(4 - paddingNeeded);
      cleanBase64 += padding;
      issues.push(`Added ${4 - paddingNeeded} padding characters`);
    }
    
    // Check if it's valid base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const isValidBase64 = base64Regex.test(cleanBase64);
    
    if (!isValidBase64) {
      issues.push('Contains invalid base64 characters');
    }
    
    // Check minimum length (a valid image should be at least a few KB)
    if (cleanBase64.length < 100) {
      issues.push('Base64 data too short for valid image');
    }
    
    // Log for debugging
    console.log('Base64 validation:', {
      originalLength: base64Content.length,
      cleanLength: cleanBase64.length,
      paddingNeeded,
      isValidBase64,
      issues
    });
    
    return {
      isValid: isValidBase64 && issues.length <= 1, // Allow padding issues only
      cleanBase64,
      issues
    };
  };

  // Function to detect image format from base64 data
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
    
    return 'png'; // Default to PNG
  };

  const generateCurlCode = () => {
    const requestBody: any = {
      model: `${modelProvider}@${modelName}`,
      input: content,
      store: true,
      tools: [{
        type: "image_generation",
        model: `${imageModelProvider}@${imageModelName}`,
        model_provider_key: imageProviderKey || "YOUR_IMAGE_PROVIDER_KEY"
      }]
    };

    if (selectedVectorStore) {
      requestBody.tools.push({
        type: "file_search",
        vector_store_ids: [selectedVectorStore],
        max_num_results: 5,
        filters: {
          type: "eq",
          key: "language",
          value: "en"
        }
      });
    }

    return `curl --location '${baseUrl}/v1/responses' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer ${maskApiKey(apiKey || 'YOUR_API_KEY')}' \\
--data '${JSON.stringify(requestBody, null, 2).replace(/'/g, "'\"'\"'")}'`;
  };

  const generatePythonCode = () => {
    const requestBody: any = {
      model: `${modelProvider}@${modelName}`,
      input: content,
      store: true,
      tools: [{
      type: "image_generation",
      model: `${imageModelProvider}@${imageModelName}`,
      model_provider_key: imageProviderKey || "YOUR_IMAGE_PROVIDER_KEY"
      }]
    };

    if (selectedVectorStore) {
      requestBody.tools.push({
        type: "file_search",
        vector_store_ids: [selectedVectorStore],
        max_num_results: 5,
        filters: {
          type: "eq",
          key: "language",
          value: "en"
        }
      });
    }

    return `import requests
import json

url = "${baseUrl}/v1/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${maskApiKey(apiKey || 'YOUR_API_KEY')}"
}

data = ${JSON.stringify(requestBody, null, 4)}

response = requests.post(url, headers=headers, json=data)
print(response.json())`;
  };

  const copyToClipboard = async (text: string, type: 'curl' | 'python') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'curl') {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
      } else {
        setCopiedPython(true);
        setTimeout(() => setCopiedPython(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const renderImage = () => {
    // Check if this is a text message that contains <image> tags
    if (type === 'text' && content.includes('<image>')) {
      const parts = content.split(/<image>|<\/image>/);
      const elements = [];
      
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          // Text part
          if (parts[i].trim()) {
            elements.push(
              <div key={i} className="mb-4">
                {parseContentWithThinkTags(parts[i])}
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
                <div className="relative inline-block bg-background2 dark:bg-accentGray-7 p-2 rounded-lg shadow-sm">
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
    
    // Handle pure image content
    if (type === 'image' || isImageContent(content)) {
    const validation = validateAndCleanBase64(content);
    
    if (!validation.isValid) {
      return (
          <div className="p-4 bg-error/5 dark:bg-error/10 border border-error/20 dark:border-error/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-error" />
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
        <div className="relative inline-block bg-background2 dark:bg-accentGray-7 p-2 rounded-lg shadow-sm">
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
    return parseContentWithThinkTags(content);
  };

  return (
    <>
      <div className={`flex mb-6 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-3xl ${role === 'user' ? 'ml-12' : 'mr-12'}`}>
          <Card className={`p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${
            role === 'user' 
              ? 'bg-primary text-white dark:bg-primary-light dark:text-accentGray-8 border-primary/20' 
              : 'bg-background1 dark:bg-accentGray-7 text-foreground dark:text-white border border-accentGray-2 dark:border-accentGray-6'
          }`}>
            {/* Message Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  role === 'user' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'
                }`}>
                  {role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                </div>
                <span className={`text-xs font-medium uppercase tracking-wide ${
                  role === 'user' 
                    ? 'text-white/80' 
                    : 'text-accentGray-5 dark:text-accentGray-4'
                }`}>
                  {role === 'user' ? 'You' : 'Assistant'}
                </span>
          </div>
          
              {/* Code generation button for user messages */}
          {role === 'user' && (
              <Button
                  variant="ghost"
                size="sm"
                onClick={() => setShowCodeModal(true)}
                  className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
              >
                  <Code className="h-3 w-3" />
              </Button>
              )}
            </div>

            {/* Message Content */}
            <div className="text-sm leading-relaxed">
              {renderImage()}
            </div>

            {/* Timestamp */}
            <div className={`mt-3 text-xs ${
              role === 'user' 
                ? 'text-white/60' 
                : 'text-accentGray-4 dark:text-accentGray-5'
            }`}>
              {timestamp.toLocaleTimeString()}
            </div>
          </Card>
        </div>
      </div>

      {/* Code Modal - redesigned with Geist UI */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-background1 dark:bg-accentGray-8 max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-xl border border-accentGray-2 dark:border-accentGray-7">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-accentGray-2 dark:border-accentGray-7">
              <h2 className="text-lg font-semibold text-foreground dark:text-white">Generate API Code</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCodeModal(false)}
                className="h-8 w-8 p-0 text-accentGray-5 hover:text-foreground dark:text-accentGray-4 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-accentGray-2 dark:border-accentGray-7">
              <button
                onClick={() => setActiveTab('curl')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'curl'
                    ? 'border-primary text-primary dark:text-primary-light bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-accentGray-5 hover:text-foreground dark:text-accentGray-4 dark:hover:text-white'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'python'
                    ? 'border-primary text-primary dark:text-primary-light bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-accentGray-5 hover:text-foreground dark:text-accentGray-4 dark:hover:text-white'
                }`}
              >
                Python
              </button>
            </div>

            {/* Code Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="relative">
                <pre className="bg-accentGray-8 dark:bg-accentGray-1 text-success dark:text-success-light text-sm p-4 rounded-lg font-mono overflow-x-auto border border-accentGray-3 dark:border-accentGray-7">
                  {activeTab === 'curl' ? generateCurlCode() : generatePythonCode()}
                </pre>
                    <Button
                  onClick={() => copyToClipboard(
                    activeTab === 'curl' ? generateCurlCode() : generatePythonCode(),
                    activeTab
                  )}
                  className="absolute top-3 right-3 h-8 w-8 p-0 bg-accentGray-7 hover:bg-accentGray-6 dark:bg-accentGray-2 dark:hover:bg-accentGray-3"
                      variant="outline"
                >
                  {(activeTab === 'curl' ? copiedCurl : copiedPython) ? (
                    <Check className="h-3 w-3 text-success" />
                      ) : (
                    <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-accentGray-2 dark:border-accentGray-7 flex justify-end">
                    <Button
                onClick={() => setShowCodeModal(false)}
                      variant="outline"
                className="border-accentGray-2 dark:border-accentGray-6 text-foreground dark:text-white hover:bg-background2 dark:hover:bg-accentGray-7"
              >
                Close
                    </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatMessage;
