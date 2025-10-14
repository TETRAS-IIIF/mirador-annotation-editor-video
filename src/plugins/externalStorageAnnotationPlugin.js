import React from 'react';
import PropTypes from 'prop-types';

// TODO attantion merge

/** Functional component version of ExternalStorageAnnotation */
function ExternalStorageAnnotation({
  PluginComponents = [],
  TargetComponent,
  targetProps,
}) {
  return (
    <TargetComponent
      {...targetProps} // eslint-disable-line react/jsx-props-no-spreading
      PluginComponents={PluginComponents}
    />
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
