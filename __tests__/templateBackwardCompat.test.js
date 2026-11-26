import { TEMPLATE_REGISTRY } from '../src/annotationForm/templates/registry';
import { TEMPLATE, TARGET_TOOL_STATE } from '../src/annotationForm/AnnotationFormUtils';
import { SHAPES_TOOL, OVERLAY_TOOL } from '../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

vi.mock('../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils', async () => {
  const actual = await vi.importActual('../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils');
  return {
    ...actual,
    getKonvaAsDataURL: vi.fn().mockResolvedValue('data:image/jpg;base64,mock'),
    getKonvaShape: vi.fn().mockReturnValue({ attrs: { image: { height: 50, width: 80 }, scaleX: 1.5, scaleY: 2 } }),
    getSvg: vi.fn().mockResolvedValue('<svg>mock</svg>'),
  };
});

const rect = (extra = {}) => ({
  fill: TARGET_TOOL_STATE.fillColor, fillColor: TARGET_TOOL_STATE.fillColor, height: 40, id: 's1', rotation: 0,
  scaleX: 1, scaleY: 1, stroke: TARGET_TOOL_STATE.strokeColor, strokeColor: TARGET_TOOL_STATE.strokeColor,
  type: SHAPES_TOOL.RECTANGLE, width: 30, x: 10, y: 20, ...extra,
});
const target = (shapes, video = false) => ({
  drawingState: { currentShape: null, isDrawing: false, shapes },
  extra: 'dropped',
  fullCanvaXYWH: '0,0,1000,800',
  scale: 1,
  ...(video ? { tend: 12, tstart: 3 } : {}),
});
const player = {
  getDisplayedMediaHeight: () => 400, getMediaTrueHeight: () => 800, getScale: () => 1, getZoom: () => 1,
};
const canvas = { id: 'https://example.org/canvas/1' };
const ctx = { canvas, playerReferences: player, windowId: 'w1' };

const states = {
  [TEMPLATE.MULTIPLE_BODY_TYPE]: [
    { body: {}, maeData: { tags: [{ value: 'date' }], target: target([rect()]), templateType: TEMPLATE.MULTIPLE_BODY_TYPE, textBody: { purpose: 'describing', type: 'TextualBody', value: '<p>Hi</p>' } }, motivation: 'commenting', type: 'Annotation' },
    { body: {}, maeData: { tags: [], target: target([rect(), rect({ id: 's2', x: 300 })], true), templateType: TEMPLATE.MULTIPLE_BODY_TYPE, textBody: { purpose: 'describing', type: 'TextualBody', value: '' } }, type: 'Annotation' },
  ],
  [TEMPLATE.TAGGING_TYPE]: [
    { body: { purpose: 'tagging', type: 'TextualBody', value: 'tag' }, maeData: { target: target([rect()], true), templateType: TEMPLATE.TAGGING_TYPE }, type: 'Annotation' },
  ],
  [TEMPLATE.TEXT_TYPE]: [
    { body: { type: 'TextualBody', value: '' }, maeData: { target: target([]), templateType: TEMPLATE.TEXT_TYPE }, type: 'Annotation' },
  ],
  [TEMPLATE.MANIFEST_TYPE]: [
    { body: { type: 'TextualBody', value: '<p>see</p>' }, maeData: { manifestNetwork: 'https://example.org/m.json', target: target([rect(), rect({ id: 's2', x: 300 })], true), templateType: TEMPLATE.MANIFEST_TYPE, textBody: { value: '' } }, type: 'Annotation' },
    { body: { type: 'TextualBody', value: '' }, maeData: { manifestNetwork: 'https://example.org/m.json', target: target([rect()]), templateType: TEMPLATE.MANIFEST_TYPE }, type: 'Annotation' },
  ],
  [TEMPLATE.KONVA_TYPE]: [
    { body: { type: 'Image', value: '' }, maeData: { target: target([rect({ fill: 'red', fillColor: 'red' })], true), templateType: TEMPLATE.KONVA_TYPE, textBody: { value: '<p>d</p>' } }, type: 'Annotation' },
  ],
  [TEMPLATE.IMAGE_TYPE]: [
    { body: { type: 'Image', value: '' }, maeData: { target: target([{ id: 'img', type: OVERLAY_TOOL.IMAGE, url: 'https://example.org/i.png', x: 5, y: 6 }], true), templateType: TEMPLATE.IMAGE_TYPE, textBody: { value: '' } }, type: 'Annotation' },
    { body: { type: 'Image', value: '' }, maeData: { target: target([]), templateType: TEMPLATE.IMAGE_TYPE, textBody: { value: '<p>x</p>' } }, type: 'Annotation' },
  ],
  [TEMPLATE.IIIF_TYPE]: [
    { body: { value: 'raw' }, maeData: { target: { source: 'c', selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' } }, templateType: TEMPLATE.IIIF_TYPE }, target: 'c#xywh=1,2,3,4', type: 'Annotation' },
  ],
};

describe('backward compatibility: each template saves exactly as MAEV 1.5.1 did', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-26T10:00:00Z')); });
  afterAll(() => vi.useRealTimers());

  Object.entries(states).forEach(([templateType, cases]) => {
    cases.forEach((state, i) => {
      it(`${templateType} #${i + 1} saves exactly as before`, async () => {
        const entry = TEMPLATE_REGISTRY((k) => k).find((e) => e.id === templateType);
        const saved = await entry.convertToAnnotation(structuredClone(state), ctx);
        // Snapshots recorded from MAEV 1.5.1's convertAnnotationStateToBeSaved, before the
        // template registry: annotations must keep saving exactly the same.
        expect(saved).toMatchSnapshot();
      });
    });
  });
});
