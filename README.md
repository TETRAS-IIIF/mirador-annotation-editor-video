# Mirador Annotation Editor Video - GPL edition

[Online demos](https://tetras-iiif.github.io/mirador-annotation-editor-video/)

## Presentation

### Generalities

`mirador-annotation-editor-video`(also known as "MAEV") is a [Mirador 4](https://github.com/projectmirador/mirador)
plugin that
adds annotation creation tools to the user interface. It support both image and video annotation.

It is based on the original [mirador-annotations](https://github.com/ProjectMirador/mirador-annotations/) plugin with a
lot of technical and functional modifications (including migration from PaperJS to Konvas for the drawing part).
### Copyrights

#### Licence

This plugin is released under the **GPL v3** license unlike MAE and the original plugin.

Please acknowledge that any modification you make must be distributed under a compatible licence and cannot be closed
source.

If you need to integrate this code base in closed source pieces of software, please contact us, so we can discuss dual
licencing.




### General functionalities

- Activate a panel with tools to create annotations on IIIF documents (manifests) containing images **and videos with 
MAEV**
- Spatial and temporal targets for annotations
- Overlay annotations (geometric forms, free hand drawing, text and images)
- Textual/semantic annotations and tags
- Annotation metadata (based on Dublin Core)
- Annotation with another manifest -> network of IIIF documents

### Technical aspects 

- Update to Material UI 7 and React 19 to follow latest Mirador upgrades (We support official M4 releases),
- The [paperjs](http://paperjs.org/ ) library has been replaced with [Konvas](https://konvajs.org) 
- Major refactoring since the original `[mirador-annotations](https://github.com/ProjectMirador/mirador-annotations/) 
plugins`

## Use in npm projects

```bash
npm install mirador-annotation-editor
```

## Use in existing npm project with previous plugins

You can override existing annotation plugin with your own versions by using npm. We support React 18 and MUI 5.

Update your `package.json` file to include the following dependencies and devDependencies:

```js
"mirador-annotations":"npm:mirador-annotation-editor-video@^1.2.2",
```

You need also to use the custom version of Mirador 4.

```json
"mirador" : "npm@mirador-video@^1.2.0",
```

## Install (local)

This method requires `nvm`, `npm`.

```
git clone git@github.com:TETRAS-IIIF/mirador-annotation-editor-video.git
cd mirador-annotation-editor-video
nvm use
npm install
```

Run a demo with Mirador and the MAE plugin :

```
npm start
```



## Persisting Annotations
Persisting annotations requires implementing a IIIF annotation server. Several 
[examples of annotation servers](https://github.com/IIIF/awesome-iiif#annotation-servers) are available on iiif-awesome.

We provide a full Mirador workspace with persistance at https://app.mirador-multi-user.com.

## Configuration 

See `demo/src/index.js` for a full configuration sample.

```js
 let annotationConfig = { // Annotation plugin related
    adapter: (canvasId) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`, 'Anonymous User'), // Adapter to persist annotations
    allowTargetShapesStyling: true, // Allow user to change color, line ... Color rendering is not fully supported by Mirador viewer in some case
    commentTemplates: [{ // Templates for comment creation
      content: '<h4>Comment</h4><p>Comment content</p>',
      title: 'Template',
    },
    {
      content: '<h4>Comment2</h4><p>Comment content</p>',
      title: 'Template 2',
    }],
    exportLocalStorageAnnotations: false, 
    quillConfig, // Configuration for the quill editor
    readonly: false, // If true, no annotation creation, edit, deleting is allowed
    tagsSuggestions: ['Mirador', 'Awesome', 'Viewer', 'IIIF', 'Template'], // Tags suggestions for autocompletion
};
```


## Contribute

Our plugin follow the Mirador guidelines. Development, design, and maintenance is driven by community needs and ongoing
feedback and discussion.
To suggest features, report bugs, and clarify usage, please submit a GitHub issue.

#### Contributor

The contributors of this software are :

- [Tétras Libre SARL](https://tetras-libre.fr)
  - David Rouquet
  - Anthony Geourjon
  - Antoine Roy

#### Property

The base of this software (up to V1) is the property of [SATT Ouest Valorisation](https://www.ouest-valorisation.fr/)
that funded its development under the French public contract AO-MA2023-0004-DV5189.
