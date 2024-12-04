import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export const getFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'video';
    case 'json':
      return 'transcript';
    default:
      return 'unknown';
  }
};

export const FileTypeIcon = ({ type, ...props }) => {
  switch (type) {
    case 'video':
      return <VideoLibraryIcon {...props} />;
    case 'transcript':
      return <DescriptionIcon {...props} />;
    default:
      return <HelpOutlineIcon {...props} />;
  }
}; 