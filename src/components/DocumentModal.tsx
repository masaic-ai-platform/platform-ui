import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import DocumentManager from './DocumentManager';

interface DocumentModalProps {
  apiKey: string;
  baseUrl: string;
  selectedVectorStore?: string;
  onVectorStoreSelect?: (vectorStoreId: string) => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  apiKey,
  baseUrl,
  selectedVectorStore,
  onVectorStoreSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0" title="Manage Documents">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Management</DialogTitle>
          <DialogDescription>
            Upload documents and manage vector stores for enhanced AI responses
          </DialogDescription>
        </DialogHeader>
        <DocumentManager
          apiKey={apiKey}
          baseUrl={baseUrl}
          selectedVectorStore={selectedVectorStore}
          onVectorStoreSelect={onVectorStoreSelect}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DocumentModal; 