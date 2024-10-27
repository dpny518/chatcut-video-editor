import React, { useState, useMemo, useCallback } from 'react';
import { VideoIcon, FileText } from 'lucide-react';

const BinViewer = () => <div>Bin Viewer Content</div>;
const TranscriptViewerSection = () => <div>Transcript Viewer Content</div>;

const BinViewerSection = () => {
  const [viewMode, setViewMode] = useState(0);
  
  // Mock store data for example
  const transcriptData = true;
  
  const handleViewModeChange = useCallback((newValue) => {
    setViewMode(newValue);
  }, []);

  const content = useMemo(() => {
    if (viewMode === 0) {
      return <BinViewer />;
    }
    return <TranscriptViewerSection />;
  }, [viewMode]);

  const TabButton = ({ icon: Icon, label, isActive, disabled, onClick }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
        ${isActive 
          ? 'text-blue-600 border-b-2 border-blue-600' 
          : 'text-gray-600 hover:text-gray-900'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-base font-medium text-gray-900">
          Bin Viewer
        </h2>
        
        <div className="flex">
          <TabButton
            icon={VideoIcon}
            label="Video"
            isActive={viewMode === 0}
            onClick={() => handleViewModeChange(0)}
          />
          <TabButton
            icon={FileText}
            label="Transcript"
            isActive={viewMode === 1}
            disabled={!transcriptData}
            onClick={() => handleViewModeChange(1)}
          />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-gray-50">
        {content}
      </div>
    </div>
  );
};

export default React.memo(BinViewerSection);