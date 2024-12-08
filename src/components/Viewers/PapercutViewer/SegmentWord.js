export const SegmentWord = React.memo(({ 
  word, 
  segment, 
  isSelected, 
  isStartOfWord, 
  onWordClick,
  onWordHover
}) => {
  const handleMouseDown = (e) => {
    console.log('MouseDown on word:', {
      word,
      selection: window.getSelection().toString(),
      preventDefault: e.defaultPrevented,
      target: e.target,
      currentTarget: e.currentTarget
    });
  };

  const handleClick = (e) => {
    console.log('Click on word:', {
      word,
      selection: window.getSelection().toString(),
      preventDefault: e.defaultPrevented,
      target: e.target,
      currentTarget: e.currentTarget
    });
    
    // Only trigger word click if no text is selected
    if (window.getSelection().toString() === '') {
      onWordClick(segment.id, word.id);
    }
  };

  const handleSelect = (e) => {
    console.log('Select on word:', {
      word,
      selection: window.getSelection().toString(),
      preventDefault: e.defaultPrevented
    });
  };

  return (
    <Typography
      component="span"
      variant="body2"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onSelect={handleSelect}
      onMouseEnter={() => onWordHover(segment.id, word.id)}
      onMouseLeave={() => onWordHover(null, null)}
      data-word-id={word.id}
      sx={{
        display: 'inline-block',
        cursor: 'text',
        px: 0.5,
        py: 0.25,
        borderRadius: 1,
        position: 'relative',
        backgroundColor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      {word.text + ' '}
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            ...(isStartOfWord ? { left: 0 } : { right: 0 }),
            top: 0,
            width: 2,
            height: '100%',
            backgroundColor: 'primary.main',
            animation: 'blink 1s step-end infinite',
            '@keyframes blink': {
              '50%': {
                opacity: 0
              }
            }
          }}
        />
      )}
    </Typography>
  );
});