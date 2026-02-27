// TODO: It may be place elsewhere
export default class LLMApiService {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async callLLM(messages) {
    console.log('messages', messages);
    const res = await fetch(`${this.endpoint}`, {
      body: JSON.stringify({
        conversation: messages,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error('LLM request failed');
    }

    const data = await res.json();
    console.log('data', data);
    return data;
  }
}
