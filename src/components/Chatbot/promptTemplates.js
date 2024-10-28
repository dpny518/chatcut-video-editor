export const promptTemplates = [
  {
    name: "Edit Transcript",
    template: `
You are a video editor. Edit the provided transcript according to this request: {user_input}
Focus on maintaining word-level timing and speaker information.
Original Transcript JSON: {input_json}
Respond with a string where each word is "word|start|end|speaker", separated by spaces.
Ensure the edited transcript follows the user's instructions, maintains chronological order, and preserves timing and speaker info.
Remove excluded words/segments. Adjust positions if order changes.
    `
  }
];
