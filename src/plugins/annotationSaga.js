import {
  all, call, put, select, takeEvery,
} from 'redux-saga/effects';

import {
  receiveAnnotation,
  requestCanvasAnnotations,
} from 'mirador/dist/es/src/state/actions';
import ActionTypes from 'mirador/dist/es/src/state/actions/action-types';
import {
  getConfig,
} from 'mirador/dist/es/src/state/selectors';

/** Retrieves all the annotations available in the annotation adapter */
function* retrieveAnnotationsFormStore(canvasId) {
  const config = yield select(getConfig);

  if (config && config.annotation.adapter) {
    const storageAdapter = config.annotation.adapter(canvasId);
    const annoPage = yield call([
      storageAdapter,
      storageAdapter.all,
    ]);
    if (annoPage) {
      yield put(
        receiveAnnotation(canvasId, storageAdapter.annotationPageId, annoPage),
      );
    }
  }
}

/**
 * A generator function which takesEvery SET_CANVAS mirador action
 * and fetches the associated annotations.
 */
function* setAnnotations(action) {
  const { canvasId, windowId } = action;

  yield put(requestCanvasAnnotations(windowId, canvasId));

  yield call(retrieveAnnotationsFormStore, canvasId);
}

/** Annotation saga for setting inital annotations */
function* annotationSaga() {
  yield all([takeEvery(ActionTypes.SET_CANVAS, setAnnotations)]);
}

const annotationSagaPlugin = {
  mode: 'wrap',
  saga: annotationSaga,
  target: 'Window',
};

export default annotationSagaPlugin;
