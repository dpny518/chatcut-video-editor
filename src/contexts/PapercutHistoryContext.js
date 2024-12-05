import React, { createContext, useReducer } from 'react';

const MAX_HISTORY_LENGTH = 50;
export const PapercutHistoryContext = createContext();

const historyReducer = (state, action) => {
  switch (action.type) {
    case 'PUSH_STATE': {
      const { past, present } = state;
      
      if (present && 
          JSON.stringify(present.content) === JSON.stringify(action.payload.content)) {
        return state;
      }

      const newPast = [...past, present].slice(-MAX_HISTORY_LENGTH);

      return {
        past: newPast.filter(Boolean),
        present: action.payload,
        future: []
      };
    }
    
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future].filter(Boolean)
      };
    }
    
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      return {
        past: [...state.past, state.present].filter(Boolean),
        present: next,
        future: newFuture
      };
    }
    
    case 'CLEAR_HISTORY':
      return {
        past: [],
        present: state.present,
        future: []
      };
      
    case 'RESTORE_HISTORY':
      return action.payload;
      
    default:
      return state;
  }
};

export const PapercutHistoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    present: null,
    future: []
  });

  return (
    <PapercutHistoryContext.Provider value={[state, dispatch]}>
      {children}
    </PapercutHistoryContext.Provider>
  );
};