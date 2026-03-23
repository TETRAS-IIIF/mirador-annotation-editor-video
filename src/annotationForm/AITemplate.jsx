import React, {
  useState, useRef, useEffect, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useSelector, useDispatch } from 'react-redux';
import { receiveAnnotation } from 'mirador';
import AnnotationFormFooter from './AnnotationFormFooter';
import LLMServiceAdapter from '../annotationAdapter/LLMServiceAdapter';
// eslint-disable-next-line import/no-named-as-default
import LLMApiService from '../annotationAdapter/LLMApiService';

export default function AITemplate({
                                     annotation,
                                     canvases,
                                     closeFormCompanionWindow,
                                     playerReferences,
                                     saveAnnotation,
                                     t,
                                   }) {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.config);
  const windows = useSelector((state) => state.windows);
  const [annotationState] = useState(annotation);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState([]);

  const windowId = Object.keys(windows)[0];
  const manifestUrl = windows[windowId]?.manifestId;

  const conversationService = useMemo(() => new LLMServiceAdapter(), []);
  const llmApi = useMemo(() => new LLMApiService(config.llm.endpoint), [config.llm.endpoint]);

  useEffect(() => {
    if (!canvases?.length) return;
    const canvasId = canvases[0].id;
    const storageKey = `canvas-${canvasId}`;
    const conv = conversationService.getConversation(storageKey);

    if (!conv) {
      conversationService.data[storageKey] = {
        activeLeafId: null,
        id: storageKey,
        messages: {},
        rootMessageId: null,
      };
      conversationService._save();
    }
    setConversationId(storageKey);
    const branch = conversationService.getActiveBranch(storageKey) || [];
    setConversation(branch);
  }, [canvases]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  const saveAISegments = async (segments) => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length) return;
    const canvas = activeCanvases[0];

    const storageAdapter = config.annotation.adapter(canvas.id);
    for (const segment of segments) {
      try {
        const annotationToSave = {
          ...segment,
          target: { ...segment.target, source: canvas.id },
        };
        const annoPage = await storageAdapter.create(annotationToSave);
        if (annoPage) {
          dispatch(receiveAnnotation(canvas.id, storageAdapter.annotationPageId, annoPage));
        }
      } catch (err) {
        console.error('AI Save Error:', err);
      }
    }
  };

  /**
   * Action: Translate logic calling FastAPI
   */
  const handleTranslate = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    const canvasId = activeCanvases[0].id;
    const canvasIndex = activeCanvases[0].index;

    setIsLoading(true);
    try {
      const response = await fetch(`${config.llm.endpoint}iiif/translate-manifest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest_url: manifestUrl,
          canvas_index: canvasIndex,
          target_lang: 'English',
          target_iso: 'en',
        }),
      });

      const updatedManifest = await response.json();
      const newAnnos = updatedManifest.items[canvasIndex]?.annotations || [];

      newAnnos.forEach((annoPage) => {
        dispatch(receiveAnnotation(canvasId, annoPage.id, annoPage));
      });

      conversationService.addMessage(conversationId, 'assistant', '✅ Translation complete. Annotations added to viewer.', null);
      setConversation(conversationService.getActiveBranch(conversationId));
    } catch (err) {
      console.error('Translation error', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Action: Describe logic calling FastAPI
   */
  const handleDescribe = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    const canvasId = activeCanvases[0].id;
    const canvasIndex = activeCanvases[0].index;

    setIsLoading(true);
    try {
      const response = await fetch(`${config.llm.endpoint}iiif/describe-manifest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest_url: manifestUrl,
          canvas_index: canvasIndex,
        }),
      });

      const updatedManifest = await response.json();
      const newAnnos = updatedManifest.items[canvasIndex]?.annotations || [];

      newAnnos.forEach((annoPage) => {
        dispatch(receiveAnnotation(canvasId, annoPage.id, annoPage));
      });

      conversationService.addMessage(conversationId, 'assistant', '✨ Visual description generated and attached.', null);
      setConversation(conversationService.getActiveBranch(conversationId));
    } catch (err) {
      console.error('Description error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (forcedInput = null) => {
    const textToSend = forcedInput || input;
    if (!textToSend.trim() || !conversationId) return;

    setIsLoading(true);
    const conv = conversationService.getConversation(conversationId);
    const parentId = conv?.activeLeafId || null;

    const userMessageId = conversationService.addMessage(
        conversationId,
        'user',
        textToSend,
        parentId,
    );

    const updatedBranch = conversationService.getActiveBranch(conversationId);
    setConversation(updatedBranch);
    setInput('');

    try {
      const formattedConversation = updatedBranch.map((m) => ({
        content: m.content,
        role: m.role,
      }));

      const activeCanvases = playerReferences.getCanvases?.() || [];
      if (!activeCanvases.length) return;

      const canvasIndex = activeCanvases[0].index;
      const reply = await llmApi.callLLM(formattedConversation, manifestUrl, canvasIndex);

      if (reply.tool_output?.type === 'AnnotationPage' && reply.tool_output?.items?.length) {
        await saveAISegments(reply.tool_output.items);
      }

      if (reply.conversation && reply.conversation[reply.conversation.length - 1]) {
        const assistantMessage = reply.conversation[reply.conversation.length - 1].content;
        conversationService.addMessage(conversationId, 'assistant', assistantMessage, userMessageId);
      }

      const finalBranch = conversationService.getActiveBranch(conversationId);
      setConversation(finalBranch);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
      <>
        <Paper
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '700px',
              mb: 2,
              overflow: 'hidden',
            }}
        >
          {/* Header */}
          <Box sx={{
            alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', gap: 1.5, p: 2,
          }}
          >
            <SmartToyOutlinedIcon />
            <Typography variant="subtitle1" fontWeight="600">AI Assistant</Typography>
          </Box>

          {/* Chat History */}
          <Box sx={{
            bgcolor: '#f8f9fa', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 2, overflowY: 'auto', p: 2,
          }}
          >
            {conversation.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                  <Box
                      key={msg.id}
                      sx={{
                        alignItems: 'flex-end', alignSelf: isAi ? 'flex-start' : 'flex-end', display: 'flex', flexDirection: isAi ? 'row' : 'row-reverse', gap: 1, maxWidth: '100%',
                      }}
                  >
                    <Avatar sx={{
                      bgcolor: isAi ? 'secondary.main' : 'primary.dark', fontSize: '1rem', height: 32, width: 32,
                    }}
                    >
                      {isAi ? <SmartToyOutlinedIcon fontSize="inherit" /> : <PersonOutlineIcon fontSize="inherit" />}
                    </Avatar>
                    <Paper
                        elevation={isAi ? 1 : 0}
                        sx={{
                          bgcolor: isAi ? 'white' : 'primary.main', borderRadius: isAi ? '18px 18px 18px 4px' : '18px 18px 4px 18px', color: isAi ? 'text.primary' : 'primary.contrastText', p: 1.5,
                        }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                      </Typography>
                    </Paper>
                  </Box>
              );
            })}
            {isLoading && (
                <Box sx={{
                  alignItems: 'center', display: 'flex', gap: 1, ml: 1, mt: 1,
                }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">Generating...</Typography>
                </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* --- QUICK ACTION SUGGESTIONS --- */}
          <Box sx={{ px: 2, pt: 1.5 }}>
            <Stack direction="row" spacing={1}>
              <Chip
                  icon={<TranslateIcon fontSize="small" />}
                  label="Translate this"
                  onClick={handleTranslate}
                  disabled={isLoading}
                  clickable
                  size="small"
                  variant="outlined"
                  color="primary"
              />
              <Chip
                  icon={<AutoAwesomeIcon fontSize="small" />}
                  label="Describe this"
                  onClick={handleDescribe}
                  disabled={isLoading}
                  clickable
                  size="small"
                  variant="outlined"
                  color="primary"
              />
            </Stack>
          </Box>

          {/* Input Field */}
          <Box sx={{ bgcolor: 'background.paper', p: 2 }}>
            <TextField
                fullWidth
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                        <IconButton color="primary" onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
                          <SendIcon />
                        </IconButton>
                    ),
                    sx: { borderRadius: 6, pr: 0.5 },
                  },
                }}
            />
          </Box>
        </Paper>

        <AnnotationFormFooter
            closeFormCompanionWindow={closeFormCompanionWindow}
            saveAnnotation={() => saveAnnotation(annotationState.newData, annotation.target)}
            t={t}
            annotationState={annotationState}
        />
      </>
  );
}

AITemplate.propTypes = {
  annotation: PropTypes.object.isRequired,
  canvases: PropTypes.arrayOf(PropTypes.object).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
