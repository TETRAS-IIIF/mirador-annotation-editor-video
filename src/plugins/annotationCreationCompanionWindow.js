import * as actions from 'mirador';
import {
  getCompanionWindow,
  getVisibleCanvases,
  getPresentAnnotationsOnSelectedCanvases,
  OSDReferences,
  VideosReferences,
  removeCompanionWindow as removeCompanionWindowAction,
  receiveAnnotation as receiveAnnotationAction,
} from 'mirador';

import annotationForm from '../annotationForm/AnnotationForm';
import { checkMediaType, WindowPlayer } from '../playerReferences';
import { MEDIA_TYPES } from '../annotationForm/AnnotationFormUtils';
import translations from '../locales/locales';

/** */
const mapDispatchToProps = (dispatch, {
  id,
  windowId,
}) => ({
  closeCompanionWindow: () => dispatch(
    removeCompanionWindowAction(windowId, id),
  ),
  receiveAnnotation: (targetId, annoId, annotation) => dispatch(
    receiveAnnotationAction(targetId, annoId, annotation),
  ),
});

/** */
function mapStateToProps(state, {
  id: companionWindowId,
  windowId,
}) {
  const currentTime = null;
  const cw = getCompanionWindow(state, {
    companionWindowId,
    windowId,
  });
  const { annotationid } = cw;

  // This architecture lead to recreate the playerReferences each time the component is rendered
  // const media = OSDReferences.get(windowId);
  // const playerReferences = new WindowPlayer(state, windowId, media, actions);

  // This could be removed but it's serve the useEffect in AnnotationForm for now.
  const canvases = getVisibleCanvases(state, { windowId });

  const mediaTypes = checkMediaType(state, windowId);

  let playerReferences;

  if (mediaTypes === MEDIA_TYPES.IMAGE) {
    playerReferences = new WindowPlayer(state, windowId, OSDReferences.get(windowId), actions);
  }
  if (mediaTypes === MEDIA_TYPES.VIDEO || mediaTypes === MEDIA_TYPES.AUDIO) {
    playerReferences = new WindowPlayer(state, windowId, VideosReferences.get(windowId), actions);
  }

  // This could be removed but it's serve the useEffect in AnnotationForm for now.
  let annotation = getPresentAnnotationsOnSelectedCanvases(state, { windowId })
    .flatMap((annoPage) => annoPage.json.items || [])
    .find((annot) => annot.id === annotationid);

  // New annotation has no ID and no templateType defined
  if (!annotation) {
    annotation = {
      id: null,
      maeData: {
        templateType: null,
      },
    };
  }

  return {
    annotation,
    canvases,
    config: {
      ...state.config,
      translations,
    },
    currentTime,
    playerReferences,
  };
}

// TODO attention


const annotationCreationCompanionWindow = {
  companionWindowKey: 'annotationCreation',
  component: annotationForm,
  mapDispatchToProps,
  mapStateToProps,
};

export default annotationCreationCompanionWindow;
