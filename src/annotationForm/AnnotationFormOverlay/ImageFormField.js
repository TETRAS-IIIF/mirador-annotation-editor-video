import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { styled, TextField } from '@mui/material';

const StyledRoot = styled('div')(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: '0',
  marginTop: '0',
}));

/** imageUrl input field for the annotation form */
function ImageFormField({
  imageUrl = null,
  onChange,
  t,
}) {
  const inputRef = useRef(null);
  const [imgIsValid, setImgIsValid] = useState(false);

  const imgUrl = imageUrl === null ? '' : imageUrl;
  useEffect(() => {
    if (inputRef.current) {
      setImgIsValid(imageUrl && inputRef.current.checkValidity());
    } else {
      setImgIsValid(!!imageUrl);
    }
  }, [imageUrl]);

  console.log('imageUrl', imageUrl);

  return (
    <StyledRoot>
      <StyledTextField
        value={imgUrl}
        onChange={(ev) => onChange(ev.target.value)}
        error={imgUrl !== '' && !imgIsValid}
        margin="dense"
        label={t('imageURL')}
        type="url"
        fullWidth
        inputRef={inputRef}
      />
      {imgIsValid && <img src={imageUrl} width="100%" height="auto" alt={t('loading_failed')} />}
    </StyledRoot>
  );
}

ImageFormField.propTypes = {
  imageUrl: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default ImageFormField;
