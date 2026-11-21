import { useEffect, useState } from 'react';

import { useWellness } from '@/hooks/use-wellness';
import { askSakhi } from '@/services/ai/aiClient';
import { buildSakhiContext } from '@/services/ai/contextBuilder';
import { SakhiAiResponse, SakhiChatMessage, SakhiConversation } from '@/services/ai/aiTypes';
import { loadConversations, saveConversations } from '@/services/conversationStorage';

export function useSakhiChat() {
  const { data, setCompanionState, addMemory } = useWellness();
  const [conversation, setConversation] = useState<SakhiConversation>(() => ({
    id: `conversation-${Date.now()}`,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  const [typing, setTyping] = useState(false);
  const [source, setSource] = useState<'ai' | 'local'>('local');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadConversations().then((items) => {
      if (items[0]) setConversation(items[0]);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) void saveConversations([conversation]);
  }, [conversation, loaded]);

  const send = async (text: string): Promise<SakhiAiResponse | undefined> => {
    const trimmed = text.trim();
    if (!trimmed || typing) return undefined;
    const now = new Date().toISOString();
    const userMessage: SakhiChatMessage = { id: `message-${Date.now()}`, role: 'user', text: trimmed, timestamp: now };

    const updatedMessages = [...conversation.messages, userMessage];
    setConversation((current) => ({ ...current, messages: updatedMessages, updatedAt: now }));
    setTyping(true);

    const historyWindow = updatedMessages.slice(-6).map((msg) => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.text,
    }));

    const context = buildSakhiContext(data);
    context.conversationHistory = historyWindow;

    const result = await askSakhi(trimmed, context);
    const sakhiMessage: SakhiChatMessage = {
      id: `message-${Date.now()}-sakhi`,
      role: 'sakhi',
      text: result.response.message,
      timestamp: new Date().toISOString(),
      metadata: { tone: result.response.tone, companionState: result.response.companionState, actions: result.response.actions },
    };

    setSource(result.source);
    setCompanionState(result.response.companionState);
    if (result.response.memoryCandidate) {
      addMemory(result.response.memoryCandidate.label, result.response.memoryCandidate.value);
    }

    setConversation((current) => ({ ...current, messages: [...current.messages, sakhiMessage], updatedAt: sakhiMessage.timestamp }));
    setTyping(false);
    return result.response;
  };

  const clear = () =>
    setConversation({
      id: `conversation-${Date.now()}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

  return { conversation, typing, source, send, clear };
}

/** @deprecated Legacy alias */
export const useMiraChat = useSakhiChat;

