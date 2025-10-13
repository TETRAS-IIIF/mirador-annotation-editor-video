# Mirador Annotation Editor - Apache edition

## Presentation

### Generalities

`mirador-annotation-editor`(also known as "MAE") is a [Mirador 4](https://github.com/projectmirador/mirador) plugin that 
adds annotation creation tools to the user interface. 

It is based on the original [mirador-annotations](https://github.com/ProjectMirador/mirador-annotations/) plugin with a
lot of technical and functional modifications and forked from https://github.com/ARVEST-APP/mirador-annotation-editor

### Copyrights

#### Licence

Like the original [mirador-annotations](https://github.com/ProjectMirador/mirador-annotations/) plugin, this 
`mirador-annotation-editor` is distributed under the **Apache License Version 2.0**.

Beware that the extension plugin [mirador-annotation-editor-video](https://github.com/SCENE-CE/mirador-annotation-editor-video) 
that supports video annotation is released under the **GPL v3** license.

Please acknowledge that any modification you make must be distributed under a compatible licence and cannot be closed 
source.

If you need to integrate this code base in closed source pieces of software, please contact us, so we can discuss dual 
licencing. 

#### Property

The base of this software (up to V1) is the property of [SATT Ouest Valorisation](https://www.ouest-valorisation.fr/) 
that funded its development under the French public contract AO-MA2023-0004-DV5189.

#### Authors 

The authors of this software are :

- Clarisse Bardiot (concept and use cases)
- Jacob Hart (specifications)
- [Tétras Libre SARL](https://tetras-libre.fr) (development):
  - David Rouquet
  - Anthony Geourjon
  - Antoine Roy

#### Contributors (updated february 2024)

- AZOPSOFT SAS 
  - Samuel Jugnet (especially code for the Konvas part)

### General functionalities 

- Activate a panel with tools to create annotations on IIIF documents (manifests) containing images **and videos with 
MAEV**
- Spatial and temporal targets for annotations
- Overlay annotations (geometric forms, free hand drawing, text and images)
- Textual/semantic annotations and tags
- Annotation metadata (based on Dublin Core)
- Annotation with another manifest -> network of IIIF documents

### Technical aspects 

- Update to Material UI 5 and React 18 to follow latest Mirador upgrades (We support mirador": "4.0.0-alpha.2",
- The [paperjs](http://paperjs.org/ ) library has been replaced with [Konvas](https://konvajs.org) 
- Major refactoring since the original `[mirador-annotations](https://github.com/ProjectMirador/mirador-annotations/) 
plugins`
- Works with the original [Mirador 4](https://github.com/projectmirador/mirador) if you need only image annotation

## Use in npm projects

```bash
npm install mirador-annotation-editor
```

## Use in existing npm project with previous plugins

You can override existing annotation plugin with your own versions by using npm. We support React 18 and MUI 5.

Update your `package.json` file to include the following dependencies and devDependencies:
```json
"mirador-annotations": "npm:mirador-annotation-editor@^1.0.10",
```

You need also to use the latest version of Mirador 4.

```json
"mirador" : "4.0.0-alpha.2"
```

If you encounter this error : 

```
Module not found: Error: Can't resolve 'mirador-annotations/es/LocalStorageAdapter' in '/home/anthony/Documents/2024-scene/mirador-integration/src'
```
Update your import :

```js
# Change your LocalStorageAdapter path import
import LocalStorageAdapter from 'mirador-annotations/es/LocalStorageAdapter';
# To that
import LocalStorageAdapter from 'mirador-annotations/es/annotationAdapter/LocalStorageAdapter';
```

You can find an example of integration in our Mirador-integration repository : 
https://github.com/SCENE-CE/mirador-integration

## Install (local)

This method requires `nvm`, `npm`.

```
git clone git@github.com:SCENE-CE/mirador-annotation-editor.git
cd mirador-annotation-editor
nvm use
npm install
```

Run a demo with Mirador and the MAE plugin :

```
npm start
```

## Use MAE with video annotation support
- If you need video annotation, you can use 
[our fork of Mirador: mirador-video](https://github.com/SCENE-CE/mirador-video)
- In addition, we have developed a wrapper of MAE to support video annotation. This wrapper is called **MAEV** and is
available in the [mirador-annotation-editor-video](https://github.com/SCENE-CE/mirador-annotation-editor-video)
repository.


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

