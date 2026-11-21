import { generateMiraResponse } from '../ai/provider.js';
import { SAKHI_SYSTEM_PROMPT as MIRA_SYSTEM_PROMPT } from '../ai/sakhiPrompt.js';
import { parseMiraResponse } from '../ai/responseParser.js';

export async function chatRoute(request, response) {
  try {
    const body = await readJson(request);
    const providerResult = await generateMiraResponse({
      systemPrompt: MIRA_SYSTEM_PROMPT,
      context: body.context,
      message: body.message,
    });
    const content = providerResult.choices?.[0]?.message?.content ?? providerResult.output_text ?? providerResult;
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(parseMiraResponse(content)));
  } catch (error) {
    response.writeHead(503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Sakhi is having trouble connecting right now.' }));
  }
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let value = '';
    request.on('data', (chunk) => {
      value += chunk;
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(value || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

