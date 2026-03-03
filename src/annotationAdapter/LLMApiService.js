// TODO: It may be place elsewhere
export default class LLMApiService {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async callLLM(messages, manifestUrl, canvasIndex) {
    console.log("messages",messages)
    console.log("manifestUrl",manifestUrl)
    console.log("canvasIndex",canvasIndex)
    const res = await fetch(`${this.endpoint}`, {
      body: JSON.stringify({
        canvas_index: canvasIndex,
        conversation: messages,
        manifest_url: manifestUrl,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error('LLM request failed');
    }

    const data = await res.json();
    console.log("llm api response",data)
    return data;
  }
}
