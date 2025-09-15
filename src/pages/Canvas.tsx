import React, { useState, useRef, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { Plus, Download, Share2, FolderOpen, Save, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useWebEmbed } from '@/hooks/useWebEmbed';
import { exportToPDF } from '@/utils/pdfExport';
import { supabase } from '@/integrations/supabase/client';

interface CanvasNode {
  id: string;
  x: number;
  y: number;
  content: string;
  type: 'note' | 'idea';
}

const Canvas = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { hasFeatureAccess } = useSubscription();
  const { createEmbed } = useWebEmbed();
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddNote = useCallback(() => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      content: 'New idea...',
      type: 'note'
    };
    setNodes(prev => [...prev, newNode]);
    toast({
      title: "Note added!",
      description: "A new note has been added to your canvas.",
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save your canvas.",
        variant: "destructive"
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Add some content to your canvas before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const canvasData = {
        owner_id: user.id,
        name: `My Canvas - ${new Date().toLocaleDateString()}`,
        data: { nodes },
        is_shared: false
      };

      const { data, error } = await supabase
        .from('canvases')
        .insert(canvasData)
        .select()
        .single();

      if (error) {
        console.error('Supabase save error:', error);
        throw new Error(`Failed to save canvas: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from save operation');
      }

      toast({
        title: "Canvas saved!",
        description: `Your canvas has been saved successfully (ID: ${data.id}).`,
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: error?.message || "Failed to save canvas. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, nodes]);

  const handleDownload = useCallback(() => {
    if (!hasFeatureAccess('export')) {
      toast({
        title: "Premium feature",
        description: "Export functionality requires a Pro or Studio subscription.",
        variant: "destructive"
      });
      return;
    }

    const canvasData = {
      timestamp: new Date().toISOString(),
      nodes: nodes,
      metadata: {
        title: 'My Canvas Export',
        created: new Date().toISOString()
      }
    };
    
    const dataStr = JSON.stringify(canvasData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `luminet-canvas-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Canvas exported!",
      description: "Your canvas has been downloaded as a JSON file.",
    });
  }, [nodes, hasFeatureAccess]);

  const handlePDFExport = useCallback(async () => {
    if (!hasFeatureAccess('export')) {
      toast({
        title: "Premium feature",
        description: "PDF export requires a Pro or Studio subscription.",
        variant: "destructive"
      });
      return;
    }

    try {
      await exportToPDF('canvas-area', `luminet-canvas-${Date.now()}`, 'Luminet Canvas');
      toast({
        title: "PDF exported!",
        description: "Your canvas has been exported as a PDF file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  }, [hasFeatureAccess]);

  const handleCreateEmbed = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to share your canvas.",
        variant: "destructive"
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: "Nothing to share",
        description: "Add some content to your canvas before sharing.",
        variant: "destructive"
      });
      return;
    }

    try {
      const embedData = await createEmbed('canvas', 'My Canvas', { nodes }, false);
      
      if (!embedData?.shareUrl) {
        throw new Error('No share URL returned from embed creation');
      }

      await navigator.clipboard.writeText(embedData.shareUrl);
      
      toast({
        title: "Share link created!",
        description: "Canvas link has been copied to your clipboard.",
      });
      
      setShowShareModal(false);
    } catch (error: any) {
      console.error('Share error:', error);
      toast({
        title: "Share failed",
        description: error?.message || "Failed to create share link. Please try again.",
        variant: "destructive"
      });
    }
  }, [createEmbed, nodes, user]);

  const handleClear = useCallback(() => {
    setNodes([]);
    toast({
      title: "Canvas cleared!",
      description: "All nodes have been removed from the canvas.",
    });
  }, []);

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                {t('canvas.title')}
              </h1>
              <p className="text-lg text-slate-600">
                Modular idea composition workspace
              </p>
            </div>
            
            <div className="flex gap-3 mt-4 lg:mt-0">
              <Button 
                variant="outline" 
                onClick={() => setShowAssetsModal(true)}
                className="border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700 transition-colors"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Assets
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownload}
                className="border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={() => setShowShareModal(true)}
                className="bg-coral-500 hover:bg-coral-600 text-white transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div 
            id="canvas-area"
            ref={canvasRef}
            className="bg-cream-50 rounded-3xl border border-warm-200 min-h-[600px] p-8 relative overflow-hidden"
          >
            {nodes.length === 0 ? (
              <div className="text-center mt-48">
                <Plus className="w-16 h-16 mx-auto mb-4 text-coral-400" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Your Creative Canvas
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Drag and drop ideas here to create visual compositions. Connect, merge, and organize your thoughts.
                </p>
                <Button 
                  onClick={handleAddNote}
                  className="mt-6 bg-coral-500 hover:bg-coral-600 text-white transition-colors"
                >
                  Add First Element
                </Button>
              </div>
            ) : (
              <>
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute bg-white rounded-lg p-3 border border-warm-200 shadow-sm cursor-move min-w-[120px]"
                    style={{ left: node.x, top: node.y }}
                  >
                    <div className="text-sm text-slate-700">{node.content}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Canvas Tools */}
          <div className="mt-8 bg-white rounded-2xl p-6 border border-warm-200">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">Canvas Tools</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                onClick={handleAddNote}
                className="h-20 flex flex-col items-center gap-2 border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700 transition-colors"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm">Add Note</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSave}
                disabled={isLoading}
                className="h-20 flex flex-col items-center gap-2 border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700 transition-colors"
              >
                <Save className="w-6 h-6" />
                <span className="text-sm">{isLoading ? 'Saving...' : 'Save'}</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownload}
                className="h-20 flex flex-col items-center gap-2 border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700 transition-colors"
              >
                <Download className="w-6 h-6" />
                <span className="text-sm">Download</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePDFExport}
                className="h-20 flex flex-col items-center gap-2 border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700 transition-colors"
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm">PDF Export</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear}
                className="h-20 flex flex-col items-center gap-2 border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700 transition-colors"
              >
                <Trash2 className="w-6 h-6" />
                <span className="text-sm">Clear</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Modal */}
      <Dialog open={showAssetsModal} onOpenChange={setShowAssetsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-slate-800">Canvas Assets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">Select assets to add to your canvas:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-warm-200 rounded-lg cursor-pointer hover:border-coral-300 transition-colors">
                <div className="w-full h-20 bg-mint-100 rounded mb-2 flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">Notes Collection</p>
              </div>
              <div className="p-4 border border-warm-200 rounded-lg cursor-pointer hover:border-coral-300 transition-colors">
                <div className="w-full h-20 bg-peach-100 rounded mb-2 flex items-center justify-center">
                  <span className="text-2xl">🎨</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">Design Templates</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-slate-800">Share Canvas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">Choose how to share your canvas:</p>
            <div className="space-y-3">
              <Button 
                onClick={handleCreateEmbed}
                className="w-full justify-start bg-coral-500 hover:bg-coral-600 text-white transition-colors"
              >
                Copy shareable link
              </Button>
              <Button 
                onClick={handlePDFExport}
                variant="outline" 
                className="w-full justify-start border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700 transition-colors"
              >
                Export as PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Canvas;
