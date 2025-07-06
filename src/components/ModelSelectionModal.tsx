import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Search, Check, ChevronDown } from 'lucide-react';

interface Model {
  name: string;
  modelSyntax: string;
  providerName: string;
  providerDescription: string;
}

interface ModelSelectionModalProps {
  models: Model[];
  selectedModel: string;
  onModelSelect: (modelSyntax: string) => void;
  loading?: boolean;
  error?: string | null;
}

const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({
  models,
  selectedModel,
  onModelSelect,
  loading = false,
  error = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModels, setFilteredModels] = useState(models);

  // Filter models based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModels(models);
    } else {
      const filtered = models.filter(model => 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.providerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredModels(filtered);
    }
  }, [searchQuery, models]);

  const getSelectedModelInfo = () => {
    const model = models.find(m => m.modelSyntax === selectedModel);
    return model || { name: 'Select a model...', providerName: '' };
  };

  const handleModelSelect = (modelSyntax: string) => {
    onModelSelect(modelSyntax);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedModelInfo = getSelectedModelInfo();

  // Group models by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.providerName]) {
      acc[model.providerName] = [];
    }
    acc[model.providerName].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-9 px-3 text-sm focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-positive-trend/60 transition-all duration-200"
          disabled={loading}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {selectedModelInfo.providerName && (
              <Badge variant="outline" className="text-xs">
                {selectedModelInfo.providerName}
              </Badge>
            )}
            <span className="truncate">
              {loading ? "Loading models..." : selectedModelInfo.name}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-3">Select a model</h4>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="pl-9 focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-positive-trend/60 transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Models List */}
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-muted-foreground">Loading models...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-muted-foreground">{error}</span>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-muted-foreground">No models found</span>
            </div>
          ) : (
            Object.entries(groupedModels).map(([provider, providerModels]) => (
              <div key={provider}>
                {Object.keys(groupedModels).length > 1 && (
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-2 px-4 bg-muted/30">
                    {provider}
                  </div>
                )}
                <div>
                  {providerModels.map((model) => (
                    <Button
                      key={model.modelSyntax}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 hover:bg-positive-trend/10 hover:text-positive-trend focus:bg-positive-trend/10 focus:text-positive-trend rounded-none"
                      onClick={() => handleModelSelect(model.modelSyntax)}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className="flex items-center justify-center w-5 h-5">
                          {selectedModel === model.modelSyntax && (
                            <Check className="h-4 w-4 text-positive-trend" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-xs">
                            {model.providerName}
                          </Badge>
                          <span className="font-medium truncate">{model.name}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSelectionModal; 