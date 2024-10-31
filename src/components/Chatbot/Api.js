//src/components/Chatbot/Api.js
import axios from 'axios';

const PROCESS_URL = process.env.REACT_APP_PROCESS_URL || 'http://74.235.95.232:8004';
const TRANSCRIPT_API_URL = 'http://74.235.95.232:5002/process_transcripts';

const AKASH_API_URL = 'https://chatapi.akash.network/api/v1/chat/completions';
const AKASH_API_KEY = 'sk-PfeZjCAKproWYwMQfw2biw';

// Filter function to clean responses
const filterWordTimings = (response) => {
  try {
    // Step 1: Remove backticks and markdown formatting
    let cleanedResponse = response
      .replace(/`/g, '')  // Remove backticks
      .replace(/\*\*/g, ''); // Remove bold markdown

    // Step 2: Extract patterns that match word|number|number|SPEAKER_XX
    const wordTimingRegex = /([^|\s]+)\|(\d+(?:\.\d+)?)\|(\d+(?:\.\d+)?)\|SPEAKER_\d+/g;
    const matches = [...cleanedResponse.matchAll(wordTimingRegex)];

    if (matches.length === 0) {
      console.error('No matches found in response:', response);
      throw new Error('No valid word timings found in response');
    }

    // Step 3: Join all matches with spaces
    const result = matches.map(match => match[0]).join(' ');

    // Debug logging
    console.log('Found word timings:', matches.length);
    console.log('First few matches:', matches.slice(0, 3));

    return result;
  } catch (error) {
    console.error('Error filtering word timings:', error);
    throw error;
  }
};

export const sendToLlama = async (wordTimingJson, promptTemplate, userInput, task) => {
  try {
    // Make prompt even more explicit
    const strictPrompt = `
Edit the provided transcript according to this request: ${userInput}
CRITICAL: Your response must ONLY contain word timings in exactly this format:
word|number|number|SPEAKER_XX
Example format:
voice|8.441|8.721|SPEAKER_01
listen|7.66|7.88|SPEAKER_01
DO NOT include any text, markdown, formatting, or explanation.
DO NOT use backticks or any other characters.
Just the word timings, one per line.

Original Transcript JSON: ${wordTimingJson}`;

    const response = await axios.post(
      AKASH_API_URL,
      {
        model: 'nvidia-Llama-3-1-Nemotron-70B-Instruct-HF',
        messages: [
          {
            role: 'user',
            content: strictPrompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AKASH_API_KEY}`
        }
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      // Add debug logging
      console.log('Raw response:', response.data.choices[0].message.content.slice(0, 200) + '...');
      
      const filteredResponse = filterWordTimings(response.data.choices[0].message.content);
      
      // Verify the filtered response
      if (!filteredResponse || filteredResponse.trim().length === 0) {
        throw new Error('Filtering produced empty result');
      }
      
      return filteredResponse;
    } else {
      throw new Error('Invalid response format from Llama API');
    }
  } catch (error) {
    console.error('Error processing Llama request:', error);
    if (error.response) {
      console.error('Llama API responded with error:', error.response.data);
      throw new Error(error.response.data.error || 'Llama API server error');
    } else if (error.request) {
      console.error('No response received from Llama API');
      throw new Error('No response from Llama API server');
    } else {
      throw error;
    }
  }
};

export const sendToLLM = async (wordTimingJson, promptTemplate, userInput, task) => {
  try {
    const response = await axios.post(`${PROCESS_URL}/process_request`, {
      text: wordTimingJson,
      prompt_template: promptTemplate,
      user_input: userInput,
      task: task,
    });
    
    if (response.data && response.data.result) {
      console.log('Raw LLM response:', response.data.result.slice(0, 200) + '...');
      
      const filteredResponse = filterWordTimings(response.data.result);
      
      if (!filteredResponse || filteredResponse.trim().length === 0) {
        throw new Error('Filtering produced empty result');
      }
      
      return filteredResponse;
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