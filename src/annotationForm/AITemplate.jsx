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
import { v4 as uuidv4 } from 'uuid';
import AnnotationFormFooter from './AnnotationFormFooter';
import LLMServiceAdapter from '../annotationAdapter/LLMServiceAdapter';
// eslint-disable-next-line import/no-named-as-default
import LLMApiService from '../annotationAdapter/LLMApiService';
import { TEMPLATE } from './AnnotationFormUtils';

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {'user' | 'assistant' | 'system'} role
 * @property {string} content
 */
/**
 * AITemplate Component
 *
 * Renders an AI-assisted chat interface for creating or refining IIIF annotations.
 * It displays a conversation history between the user and an assistant, handling
 * real-time input and displaying JSON-formatted responses.
 *
 * @param {object} props - The component props
 * @param {object} props.annotation
 * - The initial annotation object (contains body, target, motivation, etc.).
 * @param {Array<object>} props.canvases
 * - An array of IIIF Canvas objects associated with the current view.
 * @param {Function} props.closeFormCompanionWindow
 * - Callback function to close the companion window.
 * @param {Function} props.saveAnnotation - Callback function to save changes to the annotation.
 *                                          Signature: (annotationData, target) => void.
 * @param {Function} props.t - Internationalization translation function.
 *
 * @returns {JSX.Element} The rendered chat interface and form footer.
 */
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
  const [annotationState] = useState(annotation);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const windows = useSelector((state) => state.windows);
  const windowId = Object.keys(windows)[0];
  const conversationService = useMemo(
    () => new LLMServiceAdapter(),
    [],
  );

  const llmApi = useMemo(
    () => new LLMApiService(config.llm.endpoint),
    [config.llm.endpoint],
  );

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
      // eslint-disable-next-line no-underscore-dangle
      conversationService._save();
    }

    setConversationId(storageKey);

    const branch = conversationService.getActiveBranch(storageKey) || [];
    setConversation(branch);
  }, [canvases]);

  // Scroll to bottom when conversation updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const createMaeAnnotation = (canvasId, annotation) => {
    const selectorValue = annotation?.target?.selector?.value;
    if (!selectorValue) return null;

    const match = selectorValue.match(/xywh=([\d\.,]+)/);
    if (!match) return null;

    const [x, y, w, h] = match[1].split(',').map(Number);

    const aiMotivation = annotation.motivation || 'describing';

    const renderMotivation = ['commenting', 'tagging', 'describing'].includes(aiMotivation)
        ? aiMotivation
        : 'commenting';

    return {
      ...annotation,
      id: uuidv4(),
      type: 'Annotation',
      motivation: renderMotivation,
      target: {
        source: canvasId,
        selector: {
          type: 'FragmentSelector',
          conformsTo: 'http://www.w3.org/TR/media-frags/',
          value: `xywh=${x},${y},${w},${h}`,
        },
      },
      maeData: {
        templateType: aiMotivation === 'tagging' ? TEMPLATE.TAGGING_TYPE : TEMPLATE.AI_TYPE,
        aiMotivation,
        target: {
          drawingState: {
            id: uuidv4(),
            tool: 'rectangle',
            x,
            y,
            width: w,
            height: h,
          },
        },
      },
    };
  };

  const saveAISegments = async (segments) => {
    // Use canvases[0] from props as the source of truth for the ID
    const canvas = canvases[0];
    if (!canvas) return;

    const storageAdapter = config.annotation.adapter(canvas.id);

    for (const segment of segments) {
      const maeAnnotation = createMaeAnnotation(canvas.id, segment);
      if (!maeAnnotation) continue;

      try {
        // 1. Persist to your storage adapter
        const annoPage = await storageAdapter.create(maeAnnotation);

        if (annoPage) {
          // 2. Dispatch to Mirador Core
          // This tells the CanvasWorld to re-draw the annotations for this canvas
          dispatch(
              receiveAnnotation(
                  canvas.id,
                  storageAdapter.annotationPageId,
                  annoPage // Ensure this contains the new item
              )
          );

          // 3. Dispatch to MAE Editor State
          // MAE uses a specific slice to track "active" annotations
          const savedAnnotation = annoPage.items.find(i => i.id === maeAnnotation.id)
              || annoPage.items[annoPage.items.length - 1];

          dispatch({
            type: 'ADD_ANNOTATION', // MAE specific action
            windowId,
            annotation: savedAnnotation,
          });
        }
      } catch (err) {
        console.error('AI Save Error:', err);
      }
    }
  };

  /**
   * Handles the submission of a user message.
   *
   * This function performs the following actions:
   * 1. Validates the input to prevent sending empty messages.
   * 2. Optimistically updates the `conversation` state to show the user's message immediately.
   * 3. Clears the `input` field and sets `isLoading` to true.
   * 4. Initiates the API request (currently simulated with setTimeout).
   *
   * @returns {void}
   */
  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    setIsLoading(true);

    const conv = conversationService.getConversation(conversationId);
    const parentId = conv?.activeLeafId || null;

    const userMessageId = conversationService.addMessage(
      conversationId,
      'user',
      input,
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

      const manifestUrl = windows[windowId]?.manifestId;
      const activeCanvases = playerReferences.getCanvases?.() || [];
      if (!activeCanvases.length) return;

      const canvasId = activeCanvases[0].index;
      const reply = await llmApi.callLLM(formattedConversation, manifestUrl, canvasId);
      console.log("reply", reply)
      if (reply.tool_output?.type === 'AnnotationPage' && reply.tool_output?.items?.length) {
        await saveAISegments(reply.tool_output.items);
      }

      let assistantMessage;
      if (reply.conversation && reply.conversation[reply.conversation.length - 1]) {
        assistantMessage = reply.conversation[reply.conversation.length - 1].content;

        conversationService.addMessage(
          conversationId,
          'assistant',
          assistantMessage,
          userMessageId,
        );
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
        <Box sx={{
          alignItems: 'center',
          bgcolor: 'primary.main',
          boxShadow: 1,
          color: 'primary.contrastText',
          display: 'flex',
          gap: 1.5,
          p: 2,
        }}
        >
          <SmartToyOutlinedIcon />
          <Typography variant="subtitle1" fontWeight="600">
            AI Assistant
          </Typography>
        </Box>

        <Box sx={{
          bgcolor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          gap: 2,
          overflowY: 'auto',
          p: 2,
        }}
        >
          {conversation.map((msg) => {
            const isAi = msg.role === 'assistant';

            return (
              <Box
                key={msg.id}
                sx={{
                  alignItems: 'flex-end',
                  alignSelf: isAi ? 'flex-start' : 'flex-end',
                  display: 'flex',
                  flexDirection: isAi ? 'row' : 'row-reverse',
                  gap: 1,
                  maxWidth: '100%',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: isAi ? 'secondary.main' : 'primary.dark',
                    fontSize: '1rem',
                    height: 32,
                    width: 32,
                  }}
                >
                  {isAi ? <SmartToyOutlinedIcon fontSize="inherit" /> : <PersonOutlineIcon fontSize="inherit" />}
                </Avatar>

                <Paper
                  elevation={isAi ? 1 : 0}
                  sx={{
                    bgcolor: isAi ? 'white' : 'primary.main',
                    border: isAi ? '1px solid #e0e0e0' : 'none',
                    borderRadius: isAi
                      ? '18px 18px 18px 4px'
                      : '18px 18px 4px 18px',
                    color: isAi ? 'text.primary' : 'primary.contrastText',
                    p: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: isAi && msg.content.includes('{') ? 'monospace' : 'inherit',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Paper>
              </Box>
            );
          })}

          {isLoading && (
            <Box sx={{
              alignItems: 'center',
              display: 'flex',
              gap: 1,
              ml: 1,
              mt: 1,
            }}
            >
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">Generating...</Typography>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider />

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
                  <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!input.trim()}
                  >
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
  // eslint-disable-next-line react/forbid-prop-types
  annotation: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(PropTypes.object).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
