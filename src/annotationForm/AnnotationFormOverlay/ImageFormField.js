import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, styled, TextField } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import Typography from '@mui/material/Typography';

const StyledDivButtonImage = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '5px',
}));

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
  isReadOnly,
  onAddImage,
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
      <Typography variant="overline">
        {t('add_image_from_url')}
      </Typography>
      {!isReadOnly && (
        <>
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
          <StyledDivButtonImage>
            <Button variant="contained" onClick={onAddImage}>
              <AddPhotoAlternateIcon />
            </Button>
          </StyledDivButtonImage>
        </>
      )}
      {imgIsValid && (
        <img src={imageUrl} width="100%" height="auto" alt={t('loading_failed')} />
      )}
    </StyledRoot>
  );
}

ImageFormField.propTypes = {
  // eslint-disable-next-line react/require-default-props
  imageUrl: PropTypes.string,
  isReadOnly: PropTypes.bool.isRequired,
  onAddImage: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default ImageFormField;
