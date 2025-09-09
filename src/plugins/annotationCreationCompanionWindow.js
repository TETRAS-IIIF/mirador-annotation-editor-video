import * as actions from 'mirador/dist/es/src/state/actions';
import { getCompanionWindow } from 'mirador/dist/es/src/state/selectors/companionWindows';
import { getVisibleCanvases } from 'mirador/dist/es/src/state/selectors/canvases';
import {
  getPresentAnnotationsOnSelectedCanvases,
} from 'mirador/dist/es/src/state/selectors/annotations';
import { OSDReferences } from 'mirador/dist/es/src/plugins/OSDReferences';
import { VideosReferences } from 'mirador/dist/es/src/plugins/VideosReferences';
import { checkMediaType, WindowPlayer } from '../playerReferences';
import { MEDIA_TYPES } from '../annotationForm/AnnotationFormUtils';
import AnnotationForm from '../annotationForm/AnnotationForm';
import translations from '../locales/locales';

/** */
const mapDispatchToProps = (dispatch, { id, windowId }) => ({
  closeCompanionWindow: () => dispatch(
    actions.removeCompanionWindow(windowId, id),
  ),
  receiveAnnotation: (targetId, annoId, annotation) => dispatch(
    actions.receiveAnnotation(targetId, annoId, annotation),
  ),
});

/** */
function mapStateToProps(state, { id: companionWindowId, windowId }) {
  const currentTime = null;
  const cw = getCompanionWindow(state, { companionWindowId, windowId });
  const { annotationid } = cw;
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
    config: { ...state.config, translations },
    currentTime,
    playerReferences,
  };
}

const annotationCreationCompanionWindowPlugin = {
  companionWindowKey: 'annotationCreation',
  component: AnnotationForm,
  mapDispatchToProps,
  mapStateToProps,
};

export default annotationCreationCompanionWindowPlugin;
