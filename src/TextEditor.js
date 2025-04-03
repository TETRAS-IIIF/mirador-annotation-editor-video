import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador/dist/es/src/state/selectors';

const StyledReactQuill = styled(ReactQuill)(({ theme }) => ({
  '.ql-editor': {
    minHeight: '150px',
  },
}));

/** Rich text editor for annotation body */
function TextEditor({
  annoHtml,
  updateAnnotationBody,
}) {
  const [editorHtml, setEditorHtml] = useState(annoHtml);
  const annotationConfig = useSelector((state) => getConfig(state)).annotation;
  const { formats, modules } = annotationConfig.quillConfig;
  /**
   * Handle Change On ReactQuil Editor
   * @param html
   */
  const handleChange = (html) => {
    setEditorHtml(html);
    if (updateAnnotationBody) {
      updateAnnotationBody(html);
    }
  };

  // Data field is needed to set bounds for the editor and avoir tooltip overflow
  return (
    <div data-text-editor="name" data-testid="textEditor">
      <StyledReactQuill
        value={editorHtml}
        onChange={handleChange}
        placeholder="Your text here"
        bounds='[data-text-editor="name"]'
        modules={modules}
        formats={formats}
      />
    </div>
  );
}

TextEditor.propTypes = {
  annoHtml: PropTypes.string.isRequired,
  updateAnnotationBody: PropTypes.func.isRequired,
};

export default TextEditor;
