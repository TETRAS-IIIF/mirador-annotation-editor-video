import React from 'react';
import PropTypes from 'prop-types';
import HotkeysListener from '../hotkeys/HotkeysListener';

// TODO attention merge

/** Functional component version of ExternalStorageAnnotation */
function ExternalStorageAnnotation({
  PluginComponents = [],
  TargetComponent,
  targetProps,
}) {
  return (
    <>
      <HotkeysListener />
      <TargetComponent
        {...targetProps} // eslint-disable-line react/jsx-props-no-spreading
        PluginComponents={PluginComponents}
      />
    </>
  );
}

ExternalStorageAnnotation.propTypes = {
  PluginComponents: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  TargetComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]).isRequired,
  targetProps: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

const externalStorageAnnotationPlugin = {
  component: ExternalStorageAnnotation,
  mode: 'wrap',
  target: 'Window',
};

export default externalStorageAnnotationPlugin;
