//src/components/Chatbot/Api.js
import axios from 'axios';

const PROCESS_URL = process.env.REACT_APP_PROCESS_URL || 'http://74.235.95.232:8004';
const TRANSCRIPT_API_URL = 'http://74.235.95.232:5002/process_transcripts';

export const sendToLLM = async (wordTimingJson, promptTemplate, userInput, task) => {
  try {
    const response = await axios.post(`${PROCESS_URL}/process_request`, {
      text: wordTimingJson,
      prompt_template: promptTemplate,
      user_input: userInput,
      task: task,
    });
    if (response.data && response.data.result) {
      return response.data.result;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error processing video content:', error);
    if (error.response) {
      console.error('Server responded with error:', error.response.data);
      throw new Error(error.response.data.error || 'Server error');
    } else if (error.request) {
      console.error('No response received from server');
      throw new Error('No response from server');
    } else {
      console.error('Error setting up request:', error.message);
      throw error;
    }
  }
};

export const processTranscripts = async (editedTranscript) => {
  try {
    console.log('Sending request to process transcripts:');
    console.log('Edited transcript:', editedTranscript);
    const response = await axios.post(TRANSCRIPT_API_URL, {
      edited_transcript: editedTranscript
    });
    console.log('Received response from server:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing transcripts:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    throw error;
  }
};