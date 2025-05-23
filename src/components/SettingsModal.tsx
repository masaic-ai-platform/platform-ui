
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  apiKey, 
  setApiKey, 
  baseUrl, 
  setBaseUrl,
  modelProvider = 'openai',
  setModelProvider = () => {},
  modelName = 'gpt-4.1-mini',
  setModelName = () => {}
}) => {
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl);
  const [tempModelProvider, setTempModelProvider] = useState(modelProvider);
  const [tempModelName, setTempModelName] = useState(modelName);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    setApiKey(tempApiKey);
    setBaseUrl(tempBaseUrl);
    setModelProvider(tempModelProvider);
    setModelName(tempModelName);
    
    localStorage.setItem('imageGen_apiKey', tempApiKey);
    localStorage.setItem('imageGen_baseUrl', tempBaseUrl);
    localStorage.setItem('imageGen_modelProvider', tempModelProvider);
    localStorage.setItem('imageGen_modelName', tempModelName);
    
    toast.success('Settings saved successfully!');
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempApiKey(apiKey);
    setTempBaseUrl(baseUrl);
    setTempModelProvider(modelProvider);
    setTempModelName(modelName);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenResponses API settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="text"
              placeholder="http://localhost:8080"
              value={tempBaseUrl}
              onChange={(e) => setTempBaseUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelProvider">Model Provider</Label>
            <Input
              id="modelProvider"
              type="text"
              placeholder="openai"
              value={tempModelProvider}
              onChange={(e) => setTempModelProvider(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelName">Model Name</Label>
            <Input
              id="modelName"
              type="text"
              placeholder="gpt-4.1-mini"
              value={tempModelName}
              onChange={(e) => setTempModelName(e.target.value)}
            />
          </div>
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
