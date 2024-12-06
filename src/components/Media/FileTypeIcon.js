// src/components/Media/FileTypeIcon.js
import React from 'react';
import {
  Folder as FolderIcon,
  Description as FileIcon
} from '@mui/icons-material';

const FileTypeIcon = ({ type }) => {
  switch (type) {
    case 'folder':
      return <FolderIcon fontSize="small" />;
    case 'docx':
      return <FileIcon fontSize="small" />;
    case 'srt':
    case 'srtx':
      return <FileIcon fontSize="small" />;
    case 'json':
      return <FileIcon fontSize="small" />;
    default:
      return <FileIcon fontSize="small" />;
  }
};

export default FileTypeIcon;