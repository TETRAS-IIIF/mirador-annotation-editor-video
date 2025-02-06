import React from 'react';

import {
  fireEvent, render, screen, waitFor,
} from './test-utils';
import TextCommentTemplate from '../src/annotationForm/TextCommentTemplate';

const container = document.createElement('div');
container.setAttribute('data-testid', 'drawContainer');

const playerReferences = {
  getContainer: vi.fn().mockReturnValue(container),
  getDisplayedMediaHeight: vi.fn().mockReturnValue(100),
  getDisplayedMediaWidth: vi.fn().mockReturnValue(200),
  getImagePosition: vi.fn().mockReturnValue({ x: 0, y: 10 }),
  getMediaTrueWidth: vi.fn().mockReturnValue(250),
  getMediaType: vi.fn(),
  getScale: vi.fn(),
  getZoom: vi.fn(),
};

vi.mock('react-konva', async () => {
  const actual = await vi.importActual('react-konva');
  return {
    ...actual,
    Circle: () => <div />,
    Layer: () => <div />,
    Rect: () => <div />,
    Stage: ({ children, ...props }) => (
      <div data-testid="Stage">
        <canvas data-testid="canvas" {...props} />
        {children}
      </div>
    ),
  };
});

/** */
function createWrapper(props) {
  const mockT = vi.fn().mockImplementation((key) => key);
  return render(
    <TextCommentTemplate
      annotation={{}}
      closeFormCompanionWindow={vi.fn()}
      playerReferences={playerReferences}
      saveAnnotation={vi.fn()}
      t={mockT}
      windowId="abc"
      {...props}
    />,
  );
}

describe.skip('TextCreation', () => {
  it('renders a note', () => {
    createWrapper();
    expect(screen.getAllByText('note'));
  });
  it('has button tool selection', () => {
    createWrapper();
    expect(screen.getByLabelText('tool_selection'));
    const btns = screen.getAllByLabelText('select_cursor');
    expect(btns).toHaveLength(3);
  });
  it('adds the AnnotationDrawing component', () => {
    document.body.appendChild(container);
    expect(screen.getByTestId('drawContainer')).toBeInTheDocument();

    expect(container.querySelector('canvas')).not.toBeInTheDocument();
    createWrapper();
    expect(container.querySelector('canvas')).toBeInTheDocument();
    document.body.removeChild(container);
  });
  it('adds the TextEditor component', () => {
    createWrapper();
    const textEditor = screen.getByTestId('textEditor');
    expect(textEditor).toBeInTheDocument();
  });
  it('adds the annotation form footer', () => {
    createWrapper();
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
  });

  it('adds the ImageFormField component', async () => {
    createWrapper();
    const btns = screen.getAllByLabelText('select_cursor');
    fireEvent.click(btns[1]);

    await waitFor(() => screen.getAllByText(/shape/i));

    expect(screen.getByText('shape')).toBeInTheDocument();
    expect(screen.getByLabelText('add_a_rectangle'));
    expect(screen.getByLabelText('add_a_circle'));
  });
  it('can handle annotations without target selector', () => {
    const wrapper = createWrapper({
      annotation: {
        body: {
          purpose: 'commenting',
          value: 'Foo bar',
        },
        target: {},
      },
    });
    expect(wrapper).toBeDefined();
  });
});
