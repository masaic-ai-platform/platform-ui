import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus, 
  Database, 
  Copy, 
  Check, 
  X 
} from 'lucide-react';

const apiUrl = 'http://localhost:6644';

interface AgenticFileSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: AgenticFileSearchConfig) => void;
  initialVectorStore?: string;
  initialIterations?: number;
  initialSelectedFiles?: string[];
  initialVectorStoreName?: string;
}

interface AgenticFileSearchConfig {
  selectedFiles: string[];
  selectedVectorStore: string;
  vectorStoreName: string;
  iterations: number;
}

interface VectorStore {
  id: string;
  name: string;
  file_counts: {
    total: number;
    completed: number;
    failed: number;
    in_progress: number;
  };
  status: string;
}

interface FileItem {
  id: string;
  filename: string;
  bytes: number;
  status: string;
  created_at: number;
}

interface FileUploadStatus {
  uploading: boolean;
  progress?: number;
  error?: string;
}

interface VectorStoreStatus {
  creating: boolean;
  error?: string;
}

interface VectorStoreFile {
  id: string;
  object: string;
  created_at: number;
  usage_bytes: number;
  vector_store_id: string;
  status: 'in_progress' | 'completed' | 'failed';
  attributes: {
    category: string;
    language: string;
    filename: string;
  };
}

interface FileUploadProgress {
  fileId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const AgenticFileSearchModal: React.FC<AgenticFileSearchModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialVectorStore,
  initialIterations,
  initialSelectedFiles,
  initialVectorStoreName
}) => {
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [vectorStoreFiles, setVectorStoreFiles] = useState<VectorStoreFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>(initialSelectedFiles || []);
  const [selectedVectorStore, setSelectedVectorStore] = useState<string>(initialVectorStore || '');
  const [iterations, setIterations] = useState<number>(initialIterations || 3);
  const [newVectorStoreName, setNewVectorStoreName] = useState('');
  const [loading, setLoading] = useState({ stores: false, files: false, vectorStoreFiles: false });
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({ uploading: false });
  const [vectorStoreStatus, setVectorStoreStatus] = useState<VectorStoreStatus>({ creating: false });
  const [attachingFiles, setAttachingFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [showVectorStoreFiles, setShowVectorStoreFiles] = useState(false);

  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: `${type} ID copied to clipboard`,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Fetch vector stores
  const fetchVectorStores = async () => {
    setLoading(prev => ({ ...prev, stores: true }));
    try {
      const response = await fetch(`${apiUrl}/v1/vector_stores`);
      if (!response.ok) throw new Error('Failed to fetch vector stores');
      const data = await response.json();
      setVectorStores(data.data || []);
    } catch (error) {
      console.error('Error fetching vector stores:', error);
      setVectorStores([]);
    } finally {
      setLoading(prev => ({ ...prev, stores: false }));
    }
  };

  // Fetch files
  const fetchFiles = async () => {
    setLoading(prev => ({ ...prev, files: true }));
    try {
      const response = await fetch(`${apiUrl}/v1/files`);
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data.data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setLoading(prev => ({ ...prev, files: false }));
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus({ uploading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'assistants');

      const response = await fetch(`${apiUrl}/v1/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const newFile = await response.json();
      setFiles(prev => [newFile, ...prev]);
      setUploadStatus({ uploading: false });
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({ 
        uploading: false, 
        error: 'Upload failed. Please try again.' 
      });
    }
  };

  // Create vector store
  const handleCreateVectorStore = async () => {
    if (!newVectorStoreName.trim()) return;

    setVectorStoreStatus({ creating: true });
    try {
      const response = await fetch(`${apiUrl}/v1/vector_stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVectorStoreName.trim(),
          file_ids: []
        }),
      });

      if (!response.ok) throw new Error('Failed to create vector store');
      
      const newStore = await response.json();
      setVectorStores(prev => [newStore, ...prev]);
      setSelectedVectorStore(newStore.id);
      setNewVectorStoreName('');
      setVectorStoreStatus({ creating: false });
    } catch (error) {
      console.error('Error creating vector store:', error);
      setVectorStoreStatus({ 
        creating: false, 
        error: 'Failed to create vector store. Please try again.' 
      });
    }
  };

  // Fetch files from vector store
  const fetchVectorStoreFiles = async (vectorStoreId: string) => {
    setLoading(prev => ({ ...prev, vectorStoreFiles: true }));
    try {
      const response = await fetch(`${apiUrl}/v1/vector_stores/${vectorStoreId}/files`);
      if (!response.ok) throw new Error('Failed to fetch vector store files');
      const data = await response.json();
      setVectorStoreFiles(data.data || []);
    } catch (error) {
      console.error('Error fetching vector store files:', error);
      setVectorStoreFiles([]);
    } finally {
      setLoading(prev => ({ ...prev, vectorStoreFiles: false }));
    }
  };

  // Track file upload status
  const trackFileStatus = async (vectorStoreId: string, fileId: string): Promise<VectorStoreFile> => {
    const response = await fetch(`${apiUrl}/v1/vector_stores/${vectorStoreId}/files/${fileId}`);
    if (!response.ok) throw new Error('Failed to check file status');
    return response.json();
  };

  // Attach files to vector store with status tracking
  // Save configuration (files are optional, only vector store is required)
  const handleSave = async () => {
    if (!selectedVectorStore) return;

    const vectorStoreName = vectorStores.find(vs => vs.id === selectedVectorStore)?.name || initialVectorStoreName || '';
    
    // If no files selected, just save the vector store configuration
    if (selectedFiles.length === 0) {
      onSave({
        selectedFiles: [],
        selectedVectorStore,
        vectorStoreName,
        iterations
      });
      onOpenChange(false);
      return;
    }

    // If files are selected, attach them to the vector store
    setAttachingFiles(selectedFiles);
    
    // Initialize upload progress
    const initialProgress = selectedFiles.map(fileId => ({
      fileId,
      status: 'uploading' as const
    }));
    setUploadProgress(initialProgress);

    try {
      // Start all uploads
      const uploadPromises = selectedFiles.map(async (fileId) => {
        const response = await fetch(`${apiUrl}/v1/vector_stores/${selectedVectorStore}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: fileId,
            attributes: {
              category: 'user_document',
              language: 'en'
            }
          }),
        });
        
        if (!response.ok) {
          setUploadProgress(prev => 
            prev.map(p => p.fileId === fileId ? { ...p, status: 'failed', error: 'Upload failed' } : p)
          );
          throw new Error(`Failed to attach file ${fileId}`);
        }

        // Update status to processing
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { ...p, status: 'processing' } : p)
        );

        return fileId;
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Track status for all uploaded files
      const trackingPromises = uploadedFiles.map(async (fileId) => {
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes with 5-second intervals

        while (attempts < maxAttempts) {
          try {
            const fileStatus = await trackFileStatus(selectedVectorStore, fileId);
            
            if (fileStatus.status === 'completed') {
              setUploadProgress(prev => 
                prev.map(p => p.fileId === fileId ? { ...p, status: 'completed' } : p)
              );
              return fileStatus;
            } else if (fileStatus.status === 'failed') {
              setUploadProgress(prev => 
                prev.map(p => p.fileId === fileId ? { ...p, status: 'failed', error: 'Processing failed' } : p)
              );
              return fileStatus;
            }
            
            // Still in progress, wait and retry
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
          } catch (error) {
            console.error(`Error tracking file ${fileId}:`, error);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }

        // Timeout
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { ...p, status: 'failed', error: 'Timeout' } : p)
        );
        throw new Error(`Timeout tracking file ${fileId}`);
      });

      await Promise.all(trackingPromises);
      
      // All files processed successfully
      onSave({
        selectedFiles,
        selectedVectorStore,
        vectorStoreName,
        iterations
      });
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error attaching files:', error);
      toast({
        description: "Some files failed to upload. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setAttachingFiles([]);
      setUploadProgress([]);
    }
  };

  // Initialize data
  useEffect(() => {
    if (open) {
      fetchVectorStores();
      fetchFiles();
      
      // If editing with an initial vector store, load its files automatically
      if (initialVectorStore) {
        setShowVectorStoreFiles(true);
      }
    }
  }, [open, initialVectorStore]);

  // Load vector store files when vector store is selected
  useEffect(() => {
    if (selectedVectorStore && showVectorStoreFiles) {
      fetchVectorStoreFiles(selectedVectorStore);
    }
  }, [selectedVectorStore, showVectorStoreFiles]);

  // Handle vector store selection change
  const handleVectorStoreChange = (value: string) => {
    setSelectedVectorStore(value);
    setShowVectorStoreFiles(true);
    setSelectedFiles([]); // Clear selected files when changing vector store
  };

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[80vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-lg font-semibold">Agentic File Search Configuration</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6">
            <div className="space-y-6">
              
              {/* Upload File & Create Vector Store */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Upload File</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadStatus.uploading}
                      className="flex-1 focus:border-positive-trend/60"
                    />
                    {uploadStatus.uploading && (
                      <Loader2 className="h-4 w-4 animate-spin text-positive-trend" />
                    )}
                  </div>
                  {uploadStatus.error && (
                    <p className="text-xs text-red-500">{uploadStatus.error}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Create Vector Store</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newVectorStoreName}
                      onChange={(e) => setNewVectorStoreName(e.target.value)}
                      placeholder="Store name"
                      className="flex-1 focus:border-positive-trend/60"
                      disabled={vectorStoreStatus.creating}
                    />
                    <Button
                      onClick={handleCreateVectorStore}
                      disabled={!newVectorStoreName.trim() || vectorStoreStatus.creating}
                      size="sm"
                      className="bg-positive-trend hover:bg-positive-trend/90 text-white"
                    >
                      {vectorStoreStatus.creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {vectorStoreStatus.error && (
                    <p className="text-xs text-red-500">{vectorStoreStatus.error}</p>
                  )}
                </div>
              </div>

              {/* Number of Iterations */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Number of Iterations</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={iterations}
                    onChange={(e) => setIterations(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-20 focus:border-positive-trend/60"
                  />
                  <span className="text-sm text-muted-foreground">
                    Number of search iterations to perform (1-10)
                  </span>
                </div>
              </div>

              {/* Vector Stores List */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Vector Store</Label>
                <Select 
                  value={selectedVectorStore} 
                  onValueChange={handleVectorStoreChange}
                  disabled={loading.stores}
                >
                  <SelectTrigger className="w-full focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {selectedVectorStore ? (
                        <>
                          <Database className="h-3 w-3 shrink-0" />
                          <SelectValue />
                          <Badge variant="outline" className="text-xs shrink-0">
                            {vectorStores.find(vs => vs.id === selectedVectorStore)?.file_counts.total || 0} files
                          </Badge>
                        </>
                      ) : (
                        <SelectValue placeholder={loading.stores ? "Loading..." : "Select vector store..."} />
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-60"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {loading.stores ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin text-positive-trend" />
                      </div>
                    ) : vectorStores.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="text-sm text-muted-foreground">No vector stores found</span>
                      </div>
                    ) : (
                      vectorStores.map((store) => (
                        <SelectItem key={store.id} value={store.id} className="p-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <Database className="h-3 w-3 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{store.name}</div>
                                <div className="text-[10px] text-muted-foreground/70 font-mono">{store.id}</div>
                              </div>
                              <Badge variant="outline" className="text-xs text-muted-foreground border-border/40">
                                {store.file_counts.total} files
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-positive-trend/20 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(store.id, 'Vector store');
                              }}
                              title={`Copy ID: ${store.id}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Files List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {showVectorStoreFiles && selectedVectorStore ? 'Vector Store Files' : 'Select Files'}
                  </Label>
                  {showVectorStoreFiles && selectedVectorStore && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowVectorStoreFiles(false)}
                      className="text-xs"
                    >
                      Back to All Files
                    </Button>
                  )}
                </div>
                
                {/* Upload Progress */}
                {uploadProgress.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm font-medium">Upload Progress</div>
                    {uploadProgress.map((progress) => {
                      const fileName = files.find(f => f.id === progress.fileId)?.filename || progress.fileId;
                      return (
                        <div key={progress.fileId} className="flex items-center space-x-2">
                          <span className="text-xs truncate flex-1">{fileName}</span>
                          <div className="flex items-center space-x-1">
                            {progress.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                            {progress.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />}
                            {progress.status === 'completed' && <Check className="h-3 w-3 text-green-500" />}
                            {progress.status === 'failed' && <span className="text-red-500 text-xs">Failed</span>}
                            <span className="text-xs capitalize text-muted-foreground">{progress.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border border-border/40 rounded-lg bg-card/50">
                  <div className="h-48 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'thin' }}>
                    <div className="p-3 space-y-2">
                      {(showVectorStoreFiles ? loading.vectorStoreFiles : loading.files) ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-4 w-4 animate-spin text-positive-trend" />
                        </div>
                      ) : (showVectorStoreFiles ? vectorStoreFiles : files).length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <span className="text-sm text-muted-foreground">
                            {showVectorStoreFiles ? 'No files in vector store' : 'No files found'}
                          </span>
                        </div>
                      ) : showVectorStoreFiles ? (
                        vectorStoreFiles.map((file) => (
                          <div
                            key={file.id}
                            className="relative p-3 rounded-lg border border-border/20 bg-card/30"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center justify-center w-4 h-4 mt-1">
                                {file.status === 'completed' && <Check className="h-3 w-3 text-green-500" />}
                                {file.status === 'failed' && <span className="text-red-500 text-xs">✕</span>}
                                {file.status === 'in_progress' && <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {file.attributes.filename}
                                  </span>
                                  <div className="flex items-center space-x-2 shrink-0">
                                    <Badge variant="outline" className="text-xs text-muted-foreground border-border/40">
                                      {formatBytes(file.usage_bytes)}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        file.status === 'completed' ? 'text-green-600 border-green-200' :
                                        file.status === 'failed' ? 'text-red-600 border-red-200' :
                                        'text-yellow-600 border-yellow-200'
                                      }`}
                                    >
                                      {file.status}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-positive-trend/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(file.id, 'File');
                                      }}
                                      title={`Copy ID: ${file.id}`}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-[10px] text-muted-foreground/70 font-mono break-all">
                                  {file.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        files.map((file) => (
                          <div
                            key={file.id}
                            className="relative p-3 hover:bg-positive-trend/10 rounded-lg transition-colors border border-transparent hover:border-positive-trend/20 group"
                          >
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                checked={selectedFiles.includes(file.id)}
                                onCheckedChange={() => handleFileToggle(file.id)}
                                className="data-[state=checked]:bg-positive-trend data-[state=checked]:border-positive-trend mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground truncate">{file.filename}</span>
                                  <div className="flex items-center space-x-2 shrink-0">
                                    <Badge variant="outline" className="text-xs text-muted-foreground border-border/40">
                                      {formatBytes(file.bytes)}
                                    </Badge>
                                    {file.status === 'processed' && (
                                      <Check className="h-3 w-3 text-positive-trend" />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-positive-trend/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(file.id, 'File');
                                      }}
                                      title={`Copy ID: ${file.id}`}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-[10px] text-muted-foreground/70 font-mono break-all">
                                  {file.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {selectedFiles.length} file(s) selected • {iterations} iteration{iterations !== 1 ? 's' : ''} • Vector store required, files optional
            </div>
            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={attachingFiles.length > 0}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedVectorStore || attachingFiles.length > 0 || uploadProgress.length > 0}
                className="bg-positive-trend hover:bg-positive-trend/90 text-white"
              >
                {uploadProgress.length > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing Files...
                  </>
                ) : attachingFiles.length > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding Files...
                  </>
                ) : selectedFiles.length > 0 ? (
                  'Add Files & Save'
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgenticFileSearchModal; 