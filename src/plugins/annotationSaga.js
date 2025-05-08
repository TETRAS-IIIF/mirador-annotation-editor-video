import {
  all, call, put, select, takeEvery,
} from 'redux-saga/effects';

import {
  receiveAnnotation,
  requestCanvasAnnotations,
} from 'mirador/dist/es/src/state/actions';
import ActionTypes from 'mirador/dist/es/src/state/actions/action-types';
import {
  getCanvases,
  getConfig,
} from 'mirador/dist/es/src/state/selectors';

/** Retrieves all the annotations available in the annotation adapter */
function* retrieveAnnotationsFormStore(canvas) {
  const config = yield select(getConfig);

  if (config && config.annotation.adapter) {
    const storageAdapter = config.annotation.adapter(canvas.id);
    const annoPage = yield call([
      storageAdapter,
      storageAdapter.all,
    ]);
    if (annoPage) {
      yield put(
        receiveAnnotation(canvas.id, storageAdapter.annotationPageId, annoPage),
      );
    }
  }
}

/** */
function* setAllAnnotations(action) {
  const { windowId } = action;
  // @ts-ignore
  const canvases = yield select(getCanvases, { windowId });

  yield all(
    canvases.map((canvas) => put(requestCanvasAnnotations(windowId, canvas.id))),
  );
  yield all(
    canvases.map((canvas) => call(retrieveAnnotationsFormStore, canvas)),
  );
}

/** Annotation saga for setting all available annotations */
function* annotationSaga() {
  yield all([takeEvery(ActionTypes.SET_CANVAS, setAllAnnotations)]);
}

const annotationSagaPlugin = {
  mode: 'wrap',
  saga: annotationSaga,
  target: 'Window',
};

export default annotationSagaPlugin;
