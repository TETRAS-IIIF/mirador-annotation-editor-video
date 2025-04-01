import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { styled } from '@mui/material/styles';

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
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'color',
    'background',
  ];

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
