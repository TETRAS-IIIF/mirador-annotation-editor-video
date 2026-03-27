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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useSelector, useDispatch } from 'react-redux';
import { receiveAnnotation } from 'mirador';
import AnnotationFormFooter from './AnnotationFormFooter';
import LLMServiceAdapter from '../annotationAdapter/LLMServiceAdapter';
// eslint-disable-next-line import/no-named-as-default
import LLMApiService from '../annotationAdapter/LLMApiService';
import UtilsChipTools from './UtilsChipTools';

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

  const pushErrorMessage = () => {
    if (!conversationId) return;

    conversationService.addMessage(
      conversationId,
      'assistant',
      'Oops — something went wrong on our side. Please try again in a moment.',
      null,
    );

    setConversation(conversationService.getActiveBranch(conversationId));
  };

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
      console.log("reply",reply);
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
      pushErrorMessage();
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
        <Box sx={{
          alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', gap: 1.5, p: 2,
        }}
        >
          <SmartToyOutlinedIcon />
          <Typography variant="subtitle1" fontWeight="600">AI Assistant</Typography>
        </Box>

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

        <UtilsChipTools
          endpoint={config.llm.endpoint}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          conversationId={conversationId}
          conversationService={conversationService}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setConversation={setConversation}
          pushErrorMessage={pushErrorMessage}
        />

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
