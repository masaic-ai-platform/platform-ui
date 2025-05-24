import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  modelProvider?: string;
  setModelProvider?: (provider: string) => void;
  modelName?: string;
  setModelName?: (model: string) => void;
  imageModelProvider?: string;
  setImageModelProvider?: (provider: string) => void;
  imageModelName?: string;
  setImageModelName?: (model: string) => void;
  imageProviderKey?: string;
  setImageProviderKey?: (key: string) => void;
  instructions?: string;
  setInstructions?: (instructions: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  apiKey, 
  setApiKey, 
  baseUrl, 
  setBaseUrl,
  modelProvider = 'openai',
  setModelProvider = () => {},
  modelName = 'gpt-4.1-mini',
  setModelName = () => {},
  imageModelProvider = 'gemini',
  setImageModelProvider = () => {},
  imageModelName = 'imagen-3.0-generate-002',
  setImageModelName = () => {},
  imageProviderKey = '',
  setImageProviderKey = () => {},
  instructions = 'Answer questions using information from the provided documents when relevant. For image generation requests, create images as requested.',
  setInstructions = () => {}
}) => {
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl);
  const [tempModelProvider, setTempModelProvider] = useState(modelProvider);
  const [tempModelName, setTempModelName] = useState(modelName);
  const [tempImageModelProvider, setTempImageModelProvider] = useState(imageModelProvider);
  const [tempImageModelName, setTempImageModelName] = useState(imageModelName);
  const [tempImageProviderKey, setTempImageProviderKey] = useState(imageProviderKey);
  const [tempInstructions, setTempInstructions] = useState(instructions);
  const [isOpen, setIsOpen] = useState(false);

  // Sync temporary state with props when they change (after localStorage loading)
  useEffect(() => {
    setTempApiKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    setTempBaseUrl(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    setTempModelProvider(modelProvider);
  }, [modelProvider]);

  useEffect(() => {
    setTempModelName(modelName);
  }, [modelName]);

  useEffect(() => {
    setTempImageModelProvider(imageModelProvider);
  }, [imageModelProvider]);

  useEffect(() => {
    setTempImageModelName(imageModelName);
  }, [imageModelName]);

  useEffect(() => {
    setTempImageProviderKey(imageProviderKey);
  }, [imageProviderKey]);

  useEffect(() => {
    setTempInstructions(instructions);
  }, [instructions]);

  const handleSave = () => {
    setApiKey(tempApiKey);
    setBaseUrl(tempBaseUrl);
    setModelProvider(tempModelProvider);
    setModelName(tempModelName);
    setImageModelProvider(tempImageModelProvider);
    setImageModelName(tempImageModelName);
    setImageProviderKey(tempImageProviderKey);
    setInstructions(tempInstructions);
    
    localStorage.setItem('imageGen_apiKey', tempApiKey);
    localStorage.setItem('imageGen_baseUrl', tempBaseUrl);
    localStorage.setItem('imageGen_modelProvider', tempModelProvider);
    localStorage.setItem('imageGen_modelName', tempModelName);
    localStorage.setItem('imageGen_imageModelProvider', tempImageModelProvider);
    localStorage.setItem('imageGen_imageModelName', tempImageModelName);
    localStorage.setItem('imageGen_imageProviderKey', tempImageProviderKey);
    localStorage.setItem('imageGen_instructions', tempInstructions);
    
    toast.success('Settings saved successfully!');
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempApiKey(apiKey);
    setTempBaseUrl(baseUrl);
    setTempModelProvider(modelProvider);
    setTempModelName(modelName);
    setTempImageModelProvider(imageModelProvider);
    setTempImageModelName(imageModelName);
    setTempImageProviderKey(imageProviderKey);
    setTempInstructions(instructions);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenResponses API settings
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input
                id="baseUrl"
                type="text"
                placeholder="http://localhost:8080"
                value={tempBaseUrl}
                onChange={(e) => setTempBaseUrl(e.target.value)}
                className="border-0 rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 font-mono border-l">
                /v1
              </div>
            </div>
            <p className="text-xs text-gray-500">The /v1 path will be automatically appended</p>
          </div>
          
          {/* Chat Model Provider, Model and Key Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900">Chat Model Provider, Model and Key</h3>
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chat API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your chat API key"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelProvider">Chat Model Provider</Label>
              <Input
                id="modelProvider"
                type="text"
                placeholder="openai"
                value={tempModelProvider}
                onChange={(e) => setTempModelProvider(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelName">Chat Model Name</Label>
              <Input
                id="modelName"
                type="text"
                placeholder="gpt-4.1-mini"
                value={tempModelName}
                onChange={(e) => setTempModelName(e.target.value)}
              />
            </div>
          </div>

          {/* Image Model Configuration Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900">Image Model Configuration</h3>
            <div className="space-y-2">
              <Label htmlFor="imageProviderKey">Image Provider Key</Label>
              <Input
                id="imageProviderKey"
                type="password"
                placeholder="Enter your image provider key"
                value={tempImageProviderKey}
                onChange={(e) => setTempImageProviderKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageModelProvider">Image Model Provider</Label>
              <Input
                id="imageModelProvider"
                type="text"
                placeholder="gemini"
                value={tempImageModelProvider}
                onChange={(e) => setTempImageModelProvider(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageModelName">Image Model Name</Label>
              <Input
                id="imageModelName"
                type="text"
                placeholder="imagen-3.0-generate-002"
                value={tempImageModelName}
                onChange={(e) => setTempImageModelName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900">Instructions</h3>
            <div className="space-y-2">
              <Label htmlFor="instructions">Model Instructions</Label>
              <Textarea
                id="instructions"
                value={tempInstructions}
                onChange={(e) => setTempInstructions(e.target.value)}
                placeholder="Enter instructions for the model behavior..."
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-gray-500">
                These instructions guide how the AI behaves when file search is enabled
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t pt-4 mt-4">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
