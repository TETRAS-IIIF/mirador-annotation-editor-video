// tests/MiradorAnnotation.test.jsx
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { i18n } from './test-i18n-setup';
import { useDispatch } from 'react-redux';

import { getWindowViewType } from 'mirador';
import LocalStorageAdapter from '../src/annotationAdapter/LocalStorageAdapter';
import MiradorAnnotation from '../src/plugins/miradorAnnotationPlugin';
import { render, screen, fireEvent } from './test-utils';

// ---- Mocks ----
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return { ...actual, useDispatch: vi.fn() };
});

vi.mock('mirador', async () => {
  const actual = await vi.importActual('mirador');
  return { ...actual, getWindowViewType: vi.fn() };
});

// ---- Default state ----
const defaultInitialState = {
  config: {
    annotation: {
      adapter: vi.fn(),
      exportLocalStorageAnnotations: true,
    },
  },
};

// ---- Helper ----
function createWrapper(props = {}, initialState = defaultInitialState) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MiradorAnnotation
        canvases={[]}
        TargetComponent={() => <div>hello</div>}
        targetProps={{ windowId: 'windowId' }}
        receiveAnnotation={vi.fn()}
        switchToSingleCanvasView={vi.fn()}
        annotationEditCompanionWindowIsOpened
        {...props}
      />
    </I18nextProvider>,
    { preloadedState: initialState },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Tests ----
describe('MiradorAnnotation', () => {
  it('renders a create new button', () => {
    createWrapper();
    const button = screen.getByRole('button', { name: /create_annotation/i });
    expect(button).toBeInTheDocument();
  });

  it('opens a new companionWindow when clicked', () => {
    const mockDispatch = vi.fn();
    (useDispatch as vi.Mock).mockImplementation(() => mockDispatch);

    (getWindowViewType as vi.Mock).mockReturnValue('single');
    createWrapper();

    const button = screen.getByRole('button', { name: /create_annotation/i });
    fireEvent.click(button);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const dispatchedAction = mockDispatch.mock.calls[0][0];
    expect(dispatchedAction).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          content: 'annotationCreation',
          position: 'right',
        }),
        type: 'mirador/ADD_COMPANION_WINDOW',
        windowId: 'windowId',
      }),
    );
  });

  it('opens single canvas view dialog if not in single view', () => {
    (getWindowViewType as vi.Mock).mockReturnValue('book');
    createWrapper();

    expect(screen.queryByText('switch_view')).toBeNull();

    const button = screen.getByRole('button', { name: /create_annotation/i });
    fireEvent.click(button);

    expect(screen.queryByText('switch_view')).toBeInTheDocument();
  });

  it('renders no export button if export or LocalStorageAdapter are not configured', () => {
    const stateWithoutLocalAdapter = {
      config: {
        annotation: {
          adapter: () => () => {},
          exportLocalStorageAnnotations: true,
        },
      },
    };
    createWrapper({}, stateWithoutLocalAdapter);
    expect(screen.queryByText(/Export local annotations for visible items/i)).toBeNull();

    const annotation = {
      adapter: () => () => {},
      exportLocalStorageAnnotations: false,
    };
    const stateWithFalsyExport = { config: annotation };
    createWrapper({}, stateWithFalsyExport);
    expect(screen.queryByText(/Export local annotations for visible items/i)).toBeNull();
  });

  it('renders export button if export and LocalStorageAdapter are configured', () => {
    const annotation = {
      adapter: () => new LocalStorageAdapter(),
      exportLocalStorageAnnotations: true,
    };

    const initialState = { config: { annotation } };
    createWrapper({}, initialState);

    const button = screen.getByRole('button', { name: /Export local annotations for visible items/i });
    expect(button).toBeInTheDocument();
  });
});
