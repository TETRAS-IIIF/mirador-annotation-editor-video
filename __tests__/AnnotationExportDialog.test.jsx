import React from 'react';

import AnnotationExportDialog from '../src/AnnotationExportDialog';
import { screen, render, waitFor } from './test-utils';

window.URL.createObjectURL = vi.fn((data) => ('downloadurl'));

const adapter = vi.fn(() => (
  {
    all: vi.fn().mockResolvedValue(
      {
        id: 'pageId/3',
        items: [
          { id: 'anno/2' },
        ],
        type: 'AnnotationPage',
      },
    ),
    annotationPageId: 'pageId/3',
  }
));

/** */
function createWrapper(props) {
  const mockT = vi.fn().mockImplementation((key) => key);
  return render(
    <AnnotationExportDialog
      canvases={[]}
      classes={{ listitem: 'testClass' }}
      config={{ annotation: { adapter } }}
      handleClose={vi.fn()}
      open
      t={mockT}
      {...props}
    />,
  );
}

describe('AnnotationExportDialog', () => {
  it('renders download link for every annotation page', async () => {
    createWrapper(
      {
        canvases: [
          { id: 'canvas/1' },
          { id: 'canvas/2' },
        ],
      },
    );
    expect(screen.getByText(/no_annotation/i)).toBeInTheDocument();

    await waitFor(() => screen.getAllByText(/export_annotation_for/i));
    const elements = screen.getAllByText(/export_annotation_for/);
    expect(elements).toHaveLength(2);
  });
});
