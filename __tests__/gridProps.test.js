import React from 'react';
import TargetTimeInput from '../src/annotationForm/TargetTimeInput';
import ManifestNetworkFormSection from '../src/annotationForm/ManifestNetworkFormSection';
import { render } from './test-utils';

/**
 * MUI 7 dropped Grid's `item` / `xs` props (with a warning); MUI 9 no longer
 * drops them, nor system props such as alignItems: they reach the DOM.
 */
describe('MAEV forms use the MUI 7+ Grid API', () => {
  const LEAKED = ['item', 'xs', 'alignitems', 'justifycontent'];
  /** Legacy Grid and layout props React passed through to DOM elements. */
  const leakedAttributes = (container) => [...container.querySelectorAll('*')]
    .flatMap((el) => LEAKED.filter((name) => el.hasAttribute(name)));

  it('TargetTimeInput (video time range)', () => {
    const playerReferences = {
      getCurrentTime: () => 0,
      getMediaDuration: () => 120,
      getMediaType: () => 'video',
      setCurrentTime: () => {},
    };
    const { container } = render(
      <TargetTimeInput onChange={vi.fn()} playerReferences={playerReferences} tend={30} tstart={5} windowId="w1" />,
    );
    expect(container).toHaveTextContent('Start');
    expect(leakedAttributes(container)).toEqual([]);
  });

  it('ManifestNetworkFormSection', () => {
    const { container } = render(
      <ManifestNetworkFormSection manifestNetwork="" onChange={vi.fn()} t={(key) => key} />,
    );
    expect(leakedAttributes(container)).toEqual([]);
  });
});
